import { Dashboard, DashboardsMessage } from "./messages";
import { getConnectedClients } from "./server";

export function sendDashboards(dashboards: Dashboard[]) {
  console.log("Sending dashboards: ", dashboards);

  const message = {
    type: "dashboards",
    data: {
      dashboards,
    },
  } as DashboardsMessage;

  const clients = getConnectedClients();
  clients.forEach((client) => {
    client.send(JSON.stringify(message));
  });
}
