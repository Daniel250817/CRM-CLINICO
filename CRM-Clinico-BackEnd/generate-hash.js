const bcrypt = require('bcryptjs');

// Contraseña a hashear
const password = 'admin12345';

// Generar el hash con salt de 10 rounds (igual que en el modelo Usuario)
bcrypt.genSalt(10, (err, salt) => {
  if (err) {
    console.error('Error al generar salt:', err);
    return;
  }
  
  bcrypt.hash(password, salt, (err, hash) => {
    if (err) {
      console.error('Error al generar hash:', err);
      return;
    }
    
    console.log('\n===========================================');
    console.log('Hash generado para la contraseña: admin12345');
    console.log('===========================================\n');
    console.log(hash);
    console.log('\n===========================================');
    console.log('Query SQL para actualizar:');
    console.log('===========================================\n');
    console.log(`UPDATE usuarios SET password = '${hash}' WHERE email = 'tu-email@ejemplo.com';`);
    console.log('\n(Reemplaza "tu-email@ejemplo.com" con el email de tu usuario)\n');
  });
});

