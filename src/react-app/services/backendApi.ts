import { AgentRequest } from "@/models/AgentRequest";
import { AgentResponse } from "@/models/AgentResponse";
import { PaymentApprovalMessage } from "@/models/PaymentApprovalMessage";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore/lite";
import { firestore } from "@/react-app/lib/firebase";
import { getEnvironment } from "@/react-app/state/appState";
import { ElementTyps } from "@/models/enums";
import { getScriptFromCache, setScriptInCache } from "@/react-app/state/cacheState";
import { ConverseWithAgentRequest } from "@/models/ConverseWithAgentRequest";
import { AgentConverseResponse } from "@/models/AgentConverseResponse";

function getBaseApiUrl() {
  const environment = getEnvironment();
  console.log("environment", environment);
  if (environment === "development") {
    return "https://wonder-super-agent-tester.nechmads.workers.dev";
  }
  return "http://localhost:5173";
}

export async function converseWithAgent(request: ConverseWithAgentRequest) {
  const response = await fetch(`${getBaseApiUrl()}/agent/converse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ request }),
  });

  const agentResponse: AgentConverseResponse = await response.json();

  return agentResponse;
}

export async function approvePayment(message: PaymentApprovalMessage) {
  console.log("approvePayment", message);
  const response = await fetch(`${getBaseApiUrl()}/agent/approvePayment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  const agentResponse: AgentConverseResponse = await response.json();

  return agentResponse;
}

export async function getAgentContext(conversationId: string) {
  const agentContextRef = doc(firestore, "agent_contexts", conversationId);
  const agentContextSnapshot = await getDoc(agentContextRef);
  const data = agentContextSnapshot.data();

  return data;
}

export async function getPendingChanges(purchaseOrderId: string) {
  const purchaseOrderRef = doc(firestore, "purchase_orders", purchaseOrderId);
  const purchaseOrderSnapshot = await getDoc(purchaseOrderRef);

  if (!purchaseOrderSnapshot.exists()) {
    return null;
  }

  const data = purchaseOrderSnapshot.data();

  console.log("data", data);
  return { items: data.items };
}

export async function getScript(movieId: string) {
  console.log("getScript", movieId);
  const cachedScript = getScriptFromCache(movieId);
  if (cachedScript) {
    console.log("returning cached script");
    return cachedScript;
  }

  const response = await fetch(`${getBaseApiUrl()}/movies/getScript`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ movieId }),
  });

  const script = await response.json();

  setScriptInCache(movieId, script);

  return script;
}

export async function getTaggableElements(movieId: string, elementType: ElementTyps) {
  console.log("getTaggableElements", movieId, elementType);
  if (!movieId || elementType === ElementTyps.MOVIE) {
    return [];
  }

  const promises = [];

  promises.push(getScriptLocalElements(movieId, elementType));
  promises.push(getGlobalElements(elementType));

  const results = await Promise.all(promises);

  console.log("results", results);

  const taggableElements: {
    id: string;
    name: string;
    type: ElementTyps;
    uiName: string;
    is_global: boolean;
  }[] = [];

  results[0].forEach((element: { id: string; name: string }) => {
    taggableElements.push({
      id: element.id,
      name: element.name,
      type: elementType,
      is_global: false,
      uiName: `local - ${element.name}`,
    });
  });

  results[1].forEach((element: { id: string; name: string }) => {
    taggableElements.push({
      id: element.id,
      name: element.name,
      type: elementType,
      is_global: true,
      uiName: `global - ${element.name}`,
    });
  });

  return taggableElements;
}

export async function getScriptLocalElements(movieId: string, elementType: ElementTyps) {
  console.log("getScriptLocalElements", movieId, elementType);
  const script = await getScript(movieId);

  switch (elementType) {
    case ElementTyps.CHARACTER: {
      const elements = script.script.characters;
      return elements;
    }
    case ElementTyps.SET: {
      const elements = script.script.sets;
      return elements;
    }
    case ElementTyps.PROP: {
      const elements = script.script.props;
      return elements;
    }
    default:
      return [];
  }
}

export async function getGlobalElements(elementType: ElementTyps) {
  switch (elementType) {
    case ElementTyps.CHARACTER: {
      const globalCharacters: object[] = [];
      const charactersRef = collection(firestore, "characters");
      const charactersQuery = query(charactersRef, where("global", "==", true));
      const charactersQuerySnapshot = await getDocs(charactersQuery);
      charactersQuerySnapshot.forEach((doc) => {
        globalCharacters.push({ ...doc.data(), id: doc.id });
      });

      return globalCharacters;
    }
    case ElementTyps.SET: {
      const globalSets: object[] = [];
      const setsRef = collection(firestore, "sets");
      const setsQuery = query(setsRef, where("global", "==", true));
      const setsQuerySnapshot = await getDocs(setsQuery);
      setsQuerySnapshot.forEach((doc) => {
        globalSets.push({ ...doc.data(), id: doc.id });
      });

      return globalSets;
    }
    case ElementTyps.PROP: {
      const globalProps: object[] = [];
      const propsRef = collection(firestore, "props");
      const propsQuery = query(propsRef, where("global", "==", true));
      const propsQuerySnapshot = await getDocs(propsQuery);
      propsQuerySnapshot.forEach((doc) => {
        globalProps.push({ ...doc.data(), id: doc.id });
      });

      return globalProps;
    }
    default:
      return [];
  }
}
