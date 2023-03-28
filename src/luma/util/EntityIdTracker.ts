export class EntityIdTracker {
  private availableIds: number[]
  private maxLength: number
  constructor(maxLength: number) {
    this.availableIds = []
    for (let i = maxLength-1; i>=0; i--) {
      this.availableIds.push(i)
    }

    this.maxLength = maxLength
  }

  public return(id: number): void {
    if (this.availableIds.includes(id)) {
      throw new Error('Returned duplicate id!')
    }

    if (id < 0 || id > this.maxLength) {
      throw new Error('Returned id not in range!')
    }

    this.availableIds.push(id)
  }

  public hasIds(): boolean {
    return this.availableIds.length > 0
  }

  public take() {
    const id = this.availableIds.pop()
    if ( id == undefined ) {
      throw new Error('Out of ids!')
    }
    return id
  }
}