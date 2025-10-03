import { z } from "zod";
import {
  type OcppCall,
  type OcppCallResult,
  OcppOutgoing,
} from "../../ocppMessage";
import type { VCP } from "../../vcp";
import { ConnectorIdSchema, IdTagInfoSchema, IdTokenSchema } from "./_common";
import { meterValuesOcppMessage } from "./meterValues";

const StartTransactionReqSchema = z.object({
  connectorId: ConnectorIdSchema,
  idTag: IdTokenSchema,
  meterStart: z.number().int(),
  reservationId: z.number().int().nullish(),
  timestamp: z.string().datetime(),
});
type StartTransactionReqType = typeof StartTransactionReqSchema;

const StartTransactionResSchema = z.object({
  idTagInfo: IdTagInfoSchema,
  transactionId: z.number().int(),
});
type StartTransactionResType = typeof StartTransactionResSchema;

class StartTransactionOcppMessage extends OcppOutgoing<
  StartTransactionReqType,
  StartTransactionResType
> {
  soc = process.env.INITIAL_SOC ?? 0;
  resHandler = async (
    vcp: VCP,
    call: OcppCall<z.infer<StartTransactionReqType>>,
    result: OcppCallResult<z.infer<StartTransactionResType>>,
  ): Promise<void> => {
    vcp.transactionManager.startTransaction(vcp, {
      transactionId: result.payload.transactionId,
      idTag: call.payload.idTag,
      connectorId: call.payload.connectorId,
      meterValuesCallback: async (transactionState) => {
        // todo: we no longer do anything dynamic with transaction state
        vcp.send(
          meterValuesOcppMessage.request({
            connectorId: call.payload.connectorId,
            transactionId: result.payload.transactionId,
            meterValue: [
              {
                timestamp: new Date().toISOString(),
                sampledValue: [
                  {
                    "value": `${Math.round(transactionState.meterValue / 720 * 100) / 100}`,
                    "context": "Sample.Periodic",
                    "format": "Raw",
                    "measurand": "Current.Import",
                    "location": "Outlet",
                    "unit": "A"
                  },
                  {
                    "value": `${transactionState.meterValue}`,
                    "context": "Sample.Periodic",
                    "format": "Raw",
                    "measurand": "Power.Active.Import",
                    "location": "Outlet",
                    "unit": "W"
                  },
                  {
                    "value": "720",
                    "context": "Sample.Periodic",
                    "format": "Raw",
                    "measurand": "Voltage",
                    "location": "Outlet",
                    "unit": "V"
                  },
                  {
                    value: `${++this.soc}`,
                    "context": "Sample.Periodic",
                    "format": "Raw",
                    "measurand": "SoC",
                    "location": "EV",
                    "unit": "Percent"
                  }
                ],
              },
            ],
          }),
        );
      },
    });
  };
}

export const startTransactionOcppMessage = new StartTransactionOcppMessage(
  "StartTransaction",
  StartTransactionReqSchema,
  StartTransactionResSchema,
);
