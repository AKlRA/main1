/** "https://www.example.com/path" -> "example.com" */
export const displayUrl = (link: string) => link.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
