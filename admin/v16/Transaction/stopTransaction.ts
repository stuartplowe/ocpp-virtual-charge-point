import * as uuid from "uuid";
import { sendAdminCommand } from "../../admin";

let transactionId = 1;

if (process.argv[2]) {
	transactionId = Number(process.argv[2]);
}

sendAdminCommand({
  action: "StopTransaction",
  messageId: uuid.v4(),
  payload: {
    idTag: "",
    // reason: "Other",
    transactionId: transactionId,
    timestamp: new Date(),
    meterStop: 2000,
  },
});
