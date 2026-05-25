const fs = require('fs');

// Fix notifications/page.tsx
let p1 = 'src/app/(main)/notifications/page.tsx';
let c1 = fs.readFileSync(p1, 'utf8');
c1 = c1.replace("We'll notify", "We'll notify");
fs.writeFileSync(p1, c1);
console.log('Fixed page.tsx');

// Fix notification-dropdown.tsx
let p2 = 'src/components/notifications/notification-dropdown.tsx';
let c2 = fs.readFileSync(p2, 'utf8');
c2 = c2.replace("We'll notify", "We'll notify");
fs.writeFileSync(p2, c2);
console.log('Fixed dropdown.tsx');
