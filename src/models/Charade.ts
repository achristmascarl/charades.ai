export default class Charade {
  constructor(
    public charadeIndex: string,
    public answer: string,
    public isoDate: number,
    public isoDateId: string,
    public promptEmbeddings: number[],
  ) {
    this.charadeIndex = charadeIndex;
    this.answer = answer;
    this.isoDate = isoDate;
    this.isoDateId = isoDateId;
    this.promptEmbeddings = promptEmbeddings;
  }
}
