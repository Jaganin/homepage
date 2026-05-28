import jeedomProxyHandler from "./proxy";

const widget = {
  api: "{url}/core/api/jeeApi.php",
  proxyHandler: jeedomProxyHandler,
  mappings: {
    status: {
      method: "POST",
    },
  },
};

export default widget;
