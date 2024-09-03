import { Organization } from '../';
import { onChange as handleOrganizationInsert } from './handlers/organizationInsert';

export async function watchChangeStreams() {
  try {
    await watchOrganizationInserts();

    console.log(
      'Watching MongoDB Change Streams for Feedback & Organization collection inserts'
    );
  } catch (err) {
    console.error('Failed to start watching MongoDB Change Streams');
  }
}

export async function watchOrganizationInserts() {
  try {
    Organization.watch([
      {
        $match: { operationType: 'insert' },
      },
    ]).on('change', handleOrganizationInsert);
  } catch (err) {
    console.error(
      `Watching Organization collection change streams errored out with: ${err}`
    );
  }
}
