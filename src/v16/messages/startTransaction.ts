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
                    "value": "56.7",
                    "context": "Sample.Periodic",
                    "format": "Raw",
                    "measurand": "Current.Import",
                    "location": "Outlet",
                    "unit": "A"
                  },
                  {
                    "value": "60.6258",
                    "context": "Sample.Periodic",
                    "format": "Raw",
                    "measurand": "Energy.Active.Import.Register",
                    "location": "Outlet",
                    "unit": "kWh"
                  },
                  {
                    "value": "0.0994",
                    "context": "Sample.Periodic",
                    "format": "Raw",
                    "measurand": "Energy.Active.Import.Interval",
                    "location": "Outlet",
                    "unit": "kWh"
                  },
                  {
                    "value": "39.8",
                    "context": "Sample.Periodic",
                    "format": "Raw",
                    "measurand": "Power.Active.Import",
                    "location": "Outlet",
                    "unit": "kW"
                  },
                  {
                    "value": "701.6",
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
                  },
                  {
                    "value": "200",
                    "context": "Sample.Periodic",
                    "format": "Raw",
                    "measurand": "Current.Offered",
                    "location": "Outlet",
                    "unit": "A"
                  },
                  {
                    "value": "40000",
                    "context": "Sample.Periodic",
                    "format": "Raw",
                    "measurand": "Power.Offered",
                    "location": "Outlet",
                    "unit": "W"
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
