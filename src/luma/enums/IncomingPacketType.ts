enum IncomingPacketType {
  PlayerIdentification = 0x00,
  SetBlock = 0x05,
  PositionAndOrientation = 0x08,
  Message = 0x0d
}

export default IncomingPacketType;