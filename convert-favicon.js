// Скрипт для конвертации favicon.webp в PNG и ICO
// Запуск: npm install sharp && node convert-favicon.js

const sharp = require('sharp');
const fs = require('fs');

async function convertFavicons() {
  try {
    const inputFile = './images/favicon.webp';
    
    if (!fs.existsSync(inputFile)) {
      console.error('❌ Файл favicon.webp не найден в папке images/');
      return;
    }

    // Конвертируем в PNG 32x32
    await sharp(inputFile)
      .resize(32, 32)
      .png()
      .toFile('./images/favicon-32x32.png');
    console.log('✅ Создан favicon-32x32.png');

    // Конвертируем в PNG 16x16
    await sharp(inputFile)
      .resize(16, 16)
      .png()
      .toFile('./images/favicon-16x16.png');
    console.log('✅ Создан favicon-16x16.png');

    // Конвертируем в ICO (используем PNG 32x32 как основу)
    // Примечание: sharp не поддерживает прямую конвертацию в ICO,
    // поэтому создаем PNG, который можно потом конвертировать
    await sharp(inputFile)
      .resize(32, 32)
      .png()
      .toFile('./images/favicon-for-ico.png');
    console.log('✅ Создан favicon-for-ico.png');
    console.log('⚠️  Для создания favicon.ico используйте онлайн конвертер:');
    console.log('   https://convertio.co/png-ico/');
    
  } catch (error) {
    console.error('❌ Ошибка конвертации:', error.message);
  }
}

convertFavicons();


