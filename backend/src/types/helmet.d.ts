declare module "helmet" {
    import type { RequestHandler } from "express";
    function helmet(): RequestHandler;
    export default helmet;
}
