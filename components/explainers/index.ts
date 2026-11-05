import type { ComponentType } from "react";
import { DataClassification } from "./DataClassification";
import { EngagementLifecycle } from "./EngagementLifecycle";
import { IncidentResponse } from "./IncidentResponse";
import { ServiceTypes } from "./ServiceTypes";

export type ExplainerId = "engagement-lifecycle" | "service-types" | "incident-response" | "data-classification";

export const EXPLAINER_IDS: ExplainerId[] = ["engagement-lifecycle", "service-types", "incident-response", "data-classification"];

export const EXPLAINERS: Record<ExplainerId, ComponentType<{ onComplete?: () => void }>> = {
  "engagement-lifecycle": EngagementLifecycle,
  "service-types": ServiceTypes,
  "incident-response": IncidentResponse,
  "data-classification": DataClassification,
};

export { EngagementLifecycle, ServiceTypes, IncidentResponse, DataClassification };
export { ExplainerShell, useStepper, type ExplainerProps } from "./ExplainerShell";
