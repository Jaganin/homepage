import jeedomProxyHandler from "./proxy";

const widget = {
  api: "{url}/core/api/jeeApi.php",
  proxyHandler: jeedomProxyHandler,
  mappings: {
    status: {
      endpoint: "status",
    },
  },
};

export default widget;
