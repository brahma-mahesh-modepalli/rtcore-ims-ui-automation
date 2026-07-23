import { getConnection } from './dbConnection';

export async function getTransferData() {

    const pool = await getConnection();

    const result = await pool.request().query(`
        SELECT TOP 1
            FromStore,
            ToStore,
            TransferReason,
            ItemName,
            Quantity
        FROM TransferTestData
        WHERE IsActive = 1
    `);

    return result.recordset[0];
}