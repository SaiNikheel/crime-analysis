import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import { firestore } from '../lib/firebase-admin';

async function loadData() {
  const records: any[] = [];
  const parser = createReadStream('MERGED_FILE.csv').pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
    })
  );

  for await (const record of parser) {
    // Convert string coordinates to numbers
    const latitude = parseFloat(record.Latitude);
    const longitude = parseFloat(record.Longitude);

    // Skip records with invalid coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      console.warn('Skipping record with invalid coordinates:', record);
      continue;
    }

    // Convert date string to Date object
    const publishedDate = new Date(record.Published_Date);
    if (isNaN(publishedDate.getTime())) {
      console.warn('Skipping record with invalid date:', record);
      continue;
    }

    records.push({
      sourceFile: record.Source_file,
      publishedDate,
      newsType: record.News_Type,
      involvedPersonsName: record.Involved_persons_name,
      involvedPersonsRole: record.Involved_persons_role,
      latitude,
      longitude,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  console.log(`Processed ${records.length} records`);

  // Batch write to Firestore
  const batchSize = 500;
  const batches = [];
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = firestore.batch();
    const chunk = records.slice(i, i + batchSize);

    chunk.forEach((record) => {
      const ref = firestore.collection('incidents').doc();
      batch.set(ref, record);
    });

    batches.push(batch.commit());
    console.log(`Committing batch ${batches.length}...`);
  }

  await Promise.all(batches);
  console.log('Data import complete!');
}

loadData().catch(console.error); 