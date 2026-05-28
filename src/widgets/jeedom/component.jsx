import Block from "components/services/widget/block";
import Container from "components/services/widget/container";
import { useTranslation } from "next-i18next";

import useWidgetAPI from "utils/proxy/use-widget-api";

const defaultFields = ["lights", "messages", "updates"];

export default function Component({ service }) {
  const { t } = useTranslation();
  const { widget } = service;

  const { data, error } = useWidgetAPI(widget, "status");

  if (error || !data) {
    return (
      <Container service={service} error={error}>
        <Block label="jeedom.lights" />
        <Block label="jeedom.messages" />
        <Block label="jeedom.updates" />
      </Container>
    );
  }

  const fields = widget?.fields ?? defaultFields;

  return (
    <Container service={service}>
      {fields.includes("lights") && (
        <Block label="jeedom.lights" value={t("common.number", { value: data.lights ?? 0 })} />
      )}
      {fields.includes("temp_int") && (
        <Block
          label="jeedom.temp_int"
          value={data.temp_int !== null ? `${t("common.number", { value: data.temp_int })}°C` : "-"}
        />
      )}
      {fields.includes("temp_ext") && (
        <Block
          label="jeedom.temp_ext"
          value={data.temp_ext !== null ? `${t("common.number", { value: data.temp_ext })}°C` : "-"}
        />
      )}
      {fields.includes("messages") && (
        <Block label="jeedom.messages" value={t("common.number", { value: data.messages ?? 0 })} />
      )}
      {fields.includes("updates") && (
        <Block label="jeedom.updates" value={t("common.number", { value: data.updates ?? 0 })} />
      )}
    </Container>
  );
}
