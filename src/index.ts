import { MinecraftClassicServer } from "./luma/classes/MinecraftClassicServer";


MinecraftClassicServer.getInstance().then((server) => {
  server.listen(9999)
})
