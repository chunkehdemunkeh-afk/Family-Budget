const CACHE_NAME = 'family-budget-v7';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting(); // activate new SW immediately
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim()) // take control of all open tabs
  );
});

self.addEventListener('fetch', e => {
  // Network-first for HTML so updates always get through
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  // Cache-first for everything else
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// Notify open tabs when a new SW has taken over
self.addEventListener('activate', () => {
  self.clients.matchAll({ type: 'window' }).then(clients => {
    clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
  });
});

// Bill reminder notifications
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_REMINDERS') {
    const bills = e.data.bills || [];
    checkUpcomingBills(bills);
  }
});

function checkUpcomingBills(bills) {
  const today = new Date();
  const todayDay = today.getDate();
  const soon = bills.filter(b => {
    if (b.paid) return false;
    const daysUntil = b.dueDay >= todayDay ? b.dueDay - todayDay : (daysInMonth(today) - todayDay) + b.dueDay;
    return daysUntil <= 3;
  });

  soon.forEach(bill => {
    const daysUntil = bill.dueDay >= todayDay ? bill.dueDay - todayDay : (daysInMonth(today) - todayDay) + bill.dueDay;
    const when = daysUntil === 0 ? 'TODAY' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;
    self.registration.showNotification(`💸 ${bill.name} due ${when}`, {
      body: `£${Number(bill.amount).toFixed(2)} coming out on the ${ordinal(bill.dueDay)}`,
      icon: './manifest.json',
      badge: './manifest.json',
      tag: `bill-${bill.id}`,
      renotify: false,
      data: { billId: bill.id }
    });
  });
}

function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function ordinal(n) {
  const s = ['th','st','nd','rd'], v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('./index.html#bills'));
});
