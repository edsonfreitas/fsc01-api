import { app } from "./setup.js";
import handler from "./setup.js"

const PORT = 9902

app.listen(PORT || 9901, () => console.log("Servidor rodando na porta 9901"));

export default handler
