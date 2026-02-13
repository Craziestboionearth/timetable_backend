import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// ✅ Healthcheck-Route für Browser & Render
app.get('/', (req, res) => {
  res.send('Stundenplan-Backend läuft ✅');
});

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

// Vision-Aufruf mit deinem Stundenplan-Prompt
async function callOpenAIVision(base64Image) {
  console.log('🔎 callOpenAIVision gestartet, Bildlänge:', base64Image.length);

  const prompt = `
  Du bist ein Experte für das Auslesen von Stundenplänen aus Bildern.

  AUFGABE:
  Analysiere das Bild eines Stundenplans. Extrahiere JEDEN einzelnen Eintrag.
  Gib ein JSON-Objekt zurück mit dem Key "stundenplan" als Array.

  FORMAT pro Eintrag:
  {
    "tag": "Montag",
    "tagId": "#WD01",
    "fach": "Mathe",
    "id": "#M0N01",
    "zeit": "#Z0012"
  }

  WOCHENTAGE → tagId:
  Montag → "#WD01", Dienstag → "#WD02", Mittwoch → "#WD03",
  Donnerstag → "#WD04", Freitag → "#WD05", Samstag → "#WD06"

  FÄCHER → id:
  Mathe → "#M0N01" | Deutsch → "#D1N02" | Englisch → "#E2N03"
  Bio → "#B3N04" | Chemie → "#C4N05" | Physik → "#P5N06"
  Spanisch → "#S6N07" | Französisch → "#F7N08" | Türkisch → "#T8N09"
  Latein → "#L9N10" | Japanisch → "#J10N11" | Chinesisch → "#C11N12"
  Russisch → "#R12N13" | Griechisch → "#G13N14" | Niederländisch → "#NL14N15"
  Italienisch → "#I15N16" | Arabisch → "#A16N17" | Kunst → "#K17N18"
  Musik → "#M18N19" | Sport → "#S19N20" | Theater → "#T20N21"
  Psychologie → "#PSYCH2" | Philosophie → "#PHIL3" | Politik → "#POL00"
  Sozialwissenschaften → "#SOW01" | Geografie → "#GEO11" | Geschichte → "#GES12"
  Naturwissenschaften → "#NW184" | Informatik → "#IT149" | Wirtschaft → "#WIRT8"
  Religion → "#REL16" | Ethik → "#ETH79"

  STARTZEITEN → zeit (WICHTIG: Nutze NUR diese IDs!):
  07:00 → "#Z0000" | 07:05 → "#Z0001" | 07:10 → "#Z0002" | 07:15 → "#Z0003"
  07:20 → "#Z0004" | 07:25 → "#Z0005" | 07:30 → "#Z0006" | 07:35 → "#Z0007"
  07:40 → "#Z0008" | 07:45 → "#Z0009" | 07:50 → "#Z0010" | 07:55 → "#Z0011"
  08:00 → "#Z0012" | 08:05 → "#Z0013" | 08:10 → "#Z0014" | 08:15 → "#Z0015"
  08:20 → "#Z0016" | 08:25 → "#Z0017" | 08:30 → "#Z0018" | 08:35 → "#Z0019"
  08:40 → "#Z0020" | 08:45 → "#Z0021" | 08:50 → "#Z0022" | 08:55 → "#Z0023"
  09:00 → "#Z0024" | 09:05 → "#Z0025" | 09:10 → "#Z0026" | 09:15 → "#Z0027"
  09:20 → "#Z0028" | 09:25 → "#Z0029" | 09:30 → "#Z0030" | 09:35 → "#Z0031"
  09:40 → "#Z0032" | 09:45 → "#Z0033" | 09:50 → "#Z0034" | 09:55 → "#Z0035"
  10:00 → "#Z0036" | 10:05 → "#Z0037" | 10:10 → "#Z0038" | 10:15 → "#Z0039"
  10:20 → "#Z0040" | 10:25 → "#Z0041" | 10:30 → "#Z0042" | 10:35 → "#Z0043"
  10:40 → "#Z0044" | 10:45 → "#Z0045" | 10:50 → "#Z0046" | 10:55 → "#Z0047"
  11:00 → "#Z0048" | 11:05 → "#Z0049" | 11:10 → "#Z0050" | 11:15 → "#Z0051"
  11:20 → "#Z0052" | 11:25 → "#Z0053" | 11:30 → "#Z0054" | 11:35 → "#Z0055"
  11:40 → "#Z0056" | 11:45 → "#Z0057" | 11:50 → "#Z0058" | 11:55 → "#Z0059"
  12:00 → "#Z0060" | 12:05 → "#Z0061" | 12:10 → "#Z0062" | 12:15 → "#Z0063"
  12:20 → "#Z0064" | 12:25 → "#Z0065" | 12:30 → "#Z0066" | 12:35 → "#Z0067"
  12:40 → "#Z0068" | 12:45 → "#Z0069" | 12:50 → "#Z0070" | 12:55 → "#Z0071"
  13:00 → "#Z0072" | 13:05 → "#Z0073" | 13:10 → "#Z0074" | 13:15 → "#Z0075"
  13:20 → "#Z0076" | 13:25 → "#Z0077" | 13:30 → "#Z0078" | 13:35 → "#Z0079"
  13:40 → "#Z0080" | 13:45 → "#Z0081" | 13:50 → "#Z0082" | 13:55 → "#Z0083"
  14:00 → "#Z0084" | 14:30 → "#Z0090" | 15:00 → "#Z0096" | 15:30 → "#Z0102"
  16:00 → "#Z0108" | 16:30 → "#Z0114" | 16:45 → "#Z0117"

  BEISPIEL für 08:00 Mathe am Montag:
  {"tag":"Montag","tagId":"#WD01","fach":"Mathe","id":"#M0N01","zeit":"#Z0012"}

  REGELN:
  1. Lies die Startzeit jeder Stunde aus dem Bild ab (z.B. "8:00" oder "1. Stunde = 08:00").
  2. Suche die passende Zeit-ID aus der Liste oben. Erfinde KEINE eigenen IDs.
  3. Erfasse ALLE Fächer für ALLE Wochentage im Bild. Überspringe nichts.
  4. Gib NUR valides JSON zurück, kein zusätzlicher Text.
  `;

  const response = await client.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      {
        role: 'system',
        content: 'Du extrahierst strukturierte Stundenplandaten aus Bildern.',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0].message.content;
  console.log('🧾 OpenAI content (gekürzt):', raw.slice(0, 300));
  return JSON.parse(raw); // z.B. { "events": [ ... ] } oder direkt [ ... ]
}


/*app.post('/analyze-timetable', (req, res) => {
  console.log('HIT /analyze-timetable RAW');
  res.json({ ok: true });
});*/



// Endpoint für deine App
app.post('/analyze-timetable', async (req, res) => {
  console.log(
    '/analyze-timetable HIT, body.length=',
    (req.body?.image || '').length
  );

  try {
    const { image } = req.body;
    console.log('📥 /analyze-timetable Request eingegangen');
    console.log('   Hat image?', !!image);

    if (!image) {
      console.log('   ❌ Kein image im Body');
      return res.status(400).json({ error: 'image missing' });
    }

    // TEST: Erstmal nur checken, ob App -> Backend -> App funktioniert:
    /*return res.json([
      { tag: 'Montag', tagId: '#WD01', fach: 'Mathe', id: '#M0N01', zeit: '#Z0024' },
    ]);*/

    // Ab hier kommst du später hin, wenn der Test oben rausgenommen wird:

    console.log('🚀 Rufe OpenAI Vision auf...');
    const visionData = await callOpenAIVision(image);
    console.log('✅ OpenAI Antwort erhalten:', JSON.stringify(visionData).slice(0, 500));

    const rawEvents = Array.isArray(visionData)
      ? visionData
      : Object.values(visionData).find(v => Array.isArray(v)) || [];

    console.log('📊 Events aus OpenAI:', rawEvents.length);

    const normalized = rawEvents.map(e => ({
      tag: e.tag ?? 'Montag',
      tagId: e.tagId ?? '#WD01',
      fach: e.fach ?? 'Unbekannt',
      id: e.id ?? '#UNKNOWN',
      zeit: e.zeit ?? '#Z0024',
    }));

    console.log('📤 Sende normalisierte Events an App:', normalized.length);
    return res.json(normalized);

  } catch (err) {
    console.error('❌ Server error', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Stundenplan backend listening on http://0.0.0.0:${port}`);
});
