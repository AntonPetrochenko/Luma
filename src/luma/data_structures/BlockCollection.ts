import { BlockUnit, MVec3 } from "../util/Vectors/MVec3";

interface BlockCollectionEntry {
  position: MVec3<BlockUnit>, 
  blockId: number
}

export class PositionedBlockMap extends Map<string, BlockCollectionEntry> {

  public setBlock(position: MVec3<BlockUnit>, blockId: number): void {
    this.set(position.identity, {position, blockId})
  }

  public removeBlockAt(position: MVec3<BlockUnit>): void {
    this.delete(position.identity)
  }
  
  public hasBlockAt(position: MVec3<BlockUnit>): boolean {
    return this.has(position.identity)
  }

  public getBlockAt(position: MVec3<BlockUnit>): BlockCollectionEntry {
    const outBlock = this.get(position.identity)
    if ( ! outBlock ) throw new Error('Given position does not exist in the block collection')
    return outBlock
  }

}