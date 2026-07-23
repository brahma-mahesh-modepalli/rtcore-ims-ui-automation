import { config } from "mssql";

export const dbConfig: config = {
    user: "RT_Reader",
    password: "afiIMkLunSWyxPtsIrM",
    server: "WBDVJDESQL001",
    database: "JDE_CRP",
    
    options: {
    instanceName: "PY",
    encrypt: true,
    trustServerCertificate: true,
  },
};