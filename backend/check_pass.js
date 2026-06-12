const bcrypt = require('bcryptjs');
const hash = "$2a$10$IKWN3Smv4aYv8OAHYuQf/udLhgGt6ElYblQ6ZqrlnmG69luqR6bsW";
console.log('admin123:', bcrypt.compareSync('admin123', hash));
console.log('123456:', bcrypt.compareSync('123456', hash));
