const express = require('express');
const cors = require('cors');
const { Client } = require('pg');

const app = express();
const PORT = 3001;

// Подключение к базе данных
const client = new Client({
  connectionString: 'postgresql://david:5o7AIPBP4WU2AfaRyAzqY1xTubmsjyR4@dpg-cvlnm6idbo4c7385v990-a.oregon-postgres.render.com/case_31na',
  ssl: { rejectUnauthorized: false }
});

// Разрешаем CORS (чтобы фронт мог делать запросы)
app.use(cors({
  origin: 'http://localhost:3001', // Замените на адрес вашего фронтенда
  methods: ['GET', 'POST'],

}));

app.get('/get', async (req, res) => {
  try {
    await client.connect();

    const query = `
      SELECT 
        cases.id,
        cases.date,
        cases.mainimg,
        cases.innerimg,
        cases.title AS case_title,
        info.title AS info_title,
        info.description AS info_description,
        sliderImg.image_url
      FROM cases
      LEFT JOIN sliderImg ON cases.id = sliderImg.case_id
      LEFT JOIN info ON cases.id = info.case_id
      ORDER BY cases.id, sliderImg.id;
    `;

    const dbRes = await client.query(query);
    const casesMap = new Map();

    dbRes.rows.forEach(row => {
      if (!casesMap.has(row.id)) {
        casesMap.set(row.id, {
          id: row.id,
          date: row.date,
          mainimg: row.mainimg,
          innerimg: row.innerimg,
          title: row.case_title,
          info: [],
          images: []
        });
      }

      const caseItem = casesMap.get(row.id);

      // Добавляем изображение, если оно не пустое
      if (row.image_url) {
        caseItem.images.push(row.image_url);
      }

      // Добавляем информацию, если ее нет в списке
      if (row.info_title && !caseItem.info.some(info => info.title === row.info_title)) {
        caseItem.info.push({ title: row.info_title, description: row.info_description });
      }
    });

    const casesWithImages = Array.from(casesMap.values());

    res.json(casesWithImages);
  } catch (err) {
    console.error('Ошибка при получении данных:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  } finally {
    await client.end();
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
