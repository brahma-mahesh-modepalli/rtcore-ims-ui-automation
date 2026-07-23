import * as sql from "mssql";
import { dbConfig } from "./dbConfig";

export async function getConnection() {
    return await sql.connect(dbConfig);
}