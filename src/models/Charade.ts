export default class Charade {
  constructor(
    public charadeIndex: string,
    public answer: string,
    public isoDate: number,
    public isoDateId: string,
  ) {
    if (answer.length !== 5) {
      throw new Error("Answer must be 5 letters long");
    }
    this.charadeIndex = charadeIndex;
    this.answer = answer;
    this.isoDate = isoDate;
    this.isoDateId = isoDateId;
  }
}
