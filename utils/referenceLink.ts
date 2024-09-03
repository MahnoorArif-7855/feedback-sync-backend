import { checkEmptyFilter } from './func';

export const renderListItem = (keyword: string, document_ids: string[], encodedSection: any) => {
  const content = `• ${keyword.replace('- ', '').split('[')[0]}`;
  const references =
    (keyword.split('[')[1] &&
      keyword
        .split('[')[1]
        ?.replace(/\s/g, '')
        .split(',')
        ?.filter(checkEmptyFilter)
        ?.map((char: any) => {
          return !isNaN(Number(char))
            ? char
            : Array.from(char)
                .filter((char) => !isNaN(Number(char)))
                .join('');
        })) ||
    [];

  const linkElements =
    references &&
    references.slice(0, 7).map((refIndex, index) => {
      if (index < 6) {
        const docId = document_ids[refIndex - 1];
        return `<${process.env.APP_URL}/dashboard/referral-feedback?feedback_id=${docId}|${refIndex} >`;
      } else {
        return `<${process.env.APP_URL}/dashboard/analysis?section=${encodedSection}|...>`;
      }
    });

  return `${content} [${linkElements}]`;
};
