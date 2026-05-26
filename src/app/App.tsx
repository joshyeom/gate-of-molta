import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { fixtureCatalog } from "../game/content/catalog";
import { PEEK_CHARACTER_DECK_IDS } from "../game/engine/abilities";
import { reduceGame } from "../game/engine/reducer";
import { defaultSetupOptions } from "../game/engine/state";
import {
  getActivePlayer,
  getCardLabel,
  getHandLimit,
  getPaymentPlans,
  getPlayer,
  getPlayerPower,
  getUsableAbilityActions,
} from "../game/engine/selectors";
import type {
  AiDifficulty,
  CardInstanceId,
  CharacterRequirement,
  GameAction,
  GameEvent,
  GameSetupOptions,
  GameState,
  PaymentPlan,
  PlayerId,
  PlayerState,
} from "../game/engine/types";
import { chooseAiAction, choosePearlsToDiscardToLimit } from "../game/solo/chooseAiAction";

type Screen = "home" | "settings" | "game";

const playerCounts: GameSetupOptions["totalPlayers"][] = [2, 3, 4, 5];
const difficulties: { value: AiDifficulty; label: string; description: string }[] = [
  { value: "easy", label: "쉬움", description: "즉시 이득만 보는 단순한 AI" },
  { value: "normal", label: "보통", description: "한 턴 흐름을 계산하는 기본 AI" },
  { value: "hard", label: "어려움", description: "시장 견제와 공개 정보를 활용하는 AI" },
  { value: "expert", label: "전문가", description: "장기 계획과 종반 타이밍을 보는 AI" },
];

const eventLabels: Record<GameEvent["type"], string> = {
  gameStarted: "게임 시작",
  turnStarted: "턴 시작",
  actionSpent: "행동 사용",
  cardMoved: "카드 이동",
  marketRefilled: "시장 보충",
  marketRefreshed: "시장 교체",
  characterPlaced: "인물 배치",
  characterDiscarded: "인물 버림",
  pearlsDiscarded: "진주 버림",
  diamondsDiscarded: "다이아 사용",
  abilityUsed: "효과 사용",
  actionBonusGranted: "추가 행동",
  pearlsReclaimed: "진주 회수",
};

const pearlArtUrls = import.meta.glob<string>("../assets/cards/pearls/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});
const characterPlaceholderUrl = new URL(
  "../assets/cards/characters/placeholder-character.webp",
  import.meta.url,
).href;
const characterArtUrls = import.meta.glob<string>("../assets/cards/characters/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});

function createGame(options: GameSetupOptions): GameState {
  return reduceGame(undefined, { type: "startGame", options }).state;
}

function randomSeed(): string {
  return `molta-${Math.random().toString(36).slice(2, 10)}`;
}

function actorName(player: PlayerState): string {
  return player.controller.type === "human" ? "나" : `AI ${player.seatIndex}`;
}

type SeatPosition = "left" | "topLeft" | "top" | "topRight" | "right";

function getSeatPositions(count: number): SeatPosition[] {
  switch (count) {
    case 1:
      return ["top"];
    case 2:
      return ["topLeft", "topRight"];
    case 3:
      return ["left", "top", "right"];
    case 4:
      return ["left", "topLeft", "topRight", "right"];
    default:
      return [];
  }
}

function formatEvents(events: GameEvent[]): string {
  return events.map((event) => eventLabels[event.type]).join(", ") || "처리 완료";
}

function formatEngineError(error: unknown): string {
  const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

  if (message.includes("Discard to hand limit")) {
    return "손패가 5장을 넘었습니다. 버릴 진주 카드를 선택하세요.";
  }
  if (message.includes("Gate is full")) {
    return "관문 인물 슬롯이 가득 찼습니다. 교체할 인물을 먼저 선택하세요.";
  }
  if (message.includes("No actions remaining")) {
    return "남은 행동이 없습니다. 턴이 자동으로 넘어갑니다.";
  }
  if (message.includes("Not active player")) {
    return "현재 차례의 플레이어만 행동할 수 있습니다.";
  }
  if (message.includes("Cannot draw from an empty pile")) {
    return "더미에 남은 카드가 없습니다.";
  }
  if (message.includes("turn cannot end")) {
    return "아직 남은 행동이 있어 턴을 넘길 수 없습니다.";
  }

  return message;
}

function finishTurnIfNeeded(
  state: GameState,
  actorId: string,
  options: { autoDiscard: boolean } = { autoDiscard: true },
): { state: GameState; events: GameEvent[] } {
  let nextState = state;
  const events: GameEvent[] = [];

  while (nextState.turn.activePlayerId === actorId && nextState.turn.actionsRemaining === 0) {
    const abilityAction = chooseAiAction(nextState, actorId);
    if (abilityAction.type !== "useAbility") {
      break;
    }
    const abilityResult = reduceGame(nextState, abilityAction);
    nextState = abilityResult.state;
    events.push(...abilityResult.events);
  }

  const player = getPlayer(nextState, actorId);
  const handLimit = getHandLimit(nextState, actorId);

  if (player.pearlHand.length > handLimit) {
    if (!options.autoDiscard) {
      return { state: nextState, events };
    }

    const discardIds = choosePearlsToDiscardToLimit(nextState, actorId);
    const discardResult = reduceGame(nextState, {
      type: "discardPearlsToLimit",
      actorId,
      pearlIds: discardIds,
    });
    nextState = discardResult.state;
    events.push(...discardResult.events);
  }

  if (nextState.turn.activePlayerId === actorId && nextState.turn.actionsRemaining === 0) {
    const endTurnResult = reduceGame(nextState, { type: "endTurn", actorId });
    nextState = endTurnResult.state;
    events.push(...endTurnResult.events);
  }

  return { state: nextState, events };
}

function runAiFullTurn(state: GameState): { state: GameState; events: GameEvent[] } {
  let nextState = state;
  const events: GameEvent[] = [];
  const aiPlayer = getActivePlayer(nextState);

  if (aiPlayer.controller.type !== "ai") {
    return { state, events };
  }

  while (
    nextState.turn.activePlayerId === aiPlayer.id &&
    nextState.turn.actionsRemaining > 0
  ) {
    const action = chooseAiAction(nextState, aiPlayer.id);
    const result = reduceGame(nextState, action);
    nextState = result.state;
    events.push(...result.events);
  }

  const finished = finishTurnIfNeeded(nextState, aiPlayer.id);
  events.push(...finished.events);
  return { state: finished.state, events };
}

function describeAction(action: GameAction, actorLabel: string): string {
  switch (action.type) {
    case "gainPearlFromMarket":
      return `${actorLabel}가 시장에서 진주를 가져옵니다.`;
    case "gainPearlFromDeck":
      return `${actorLabel}가 진주 더미에서 카드를 뽑습니다.`;
    case "refreshPearlMarket":
      return `${actorLabel}가 진주 시장을 새로 고칩니다.`;
    case "placeCharacterFromMarket":
      return `${actorLabel}가 시장 인물을 관문에 배치합니다.`;
    case "placeCharacterFromDeck":
      return `${actorLabel}가 인물 더미에서 배치합니다.`;
    case "activateGateCharacter":
      return `${actorLabel}가 관문 인물을 활성화합니다!`;
    case "useAbility":
      return `${actorLabel}가 인물 효과를 사용합니다.`;
    case "discardPearlsToLimit":
      return `${actorLabel}가 손패를 정리합니다.`;
    case "endTurn":
      return `${actorLabel}가 턴을 마칩니다.`;
    default:
      return `${actorLabel}가 행동합니다.`;
  }
}

function actionToneOf(action: GameAction): "gain" | "place" | "activate" | "refresh" | "ai" {
  switch (action.type) {
    case "gainPearlFromMarket":
    case "gainPearlFromDeck":
      return "gain";
    case "placeCharacterFromMarket":
    case "placeCharacterFromDeck":
      return "place";
    case "activateGateCharacter":
      return "activate";
    case "useAbility":
      return "activate";
    case "refreshPearlMarket":
      return "refresh";
    default:
      return "ai";
  }
}

function actionFocusCards(action: GameAction, state: GameState): CardInstanceId[] {
  switch (action.type) {
    case "gainPearlFromMarket":
      return [state.market.pearlMarket[action.marketIndex]].filter(Boolean) as CardInstanceId[];
    case "placeCharacterFromMarket":
      return [state.market.characterMarket[action.marketIndex]].filter(Boolean) as CardInstanceId[];
    case "activateGateCharacter":
      return [
        action.characterInstanceId,
        ...action.payment.pearlIds,
        ...action.payment.diamondUses.map((use) => use.diamondId),
        ...(action.payment.virtualPearls ?? []).map((virtualPearl) => virtualPearl.sourceCharacterId),
        ...(action.payment.spentDiamondIds ?? []),
      ];
    case "useAbility": {
      const sourceCardId = action.choices.sourceCardId;
      return typeof sourceCardId === "string" ? [sourceCardId] : [];
    }
    case "refreshPearlMarket":
      return [...state.market.pearlMarket];
    default:
      return [];
  }
}

function getCardKind(state: GameState, cardId: CardInstanceId): "pearl" | "character" | "gate" {
  const definitionId = state.cardsById[cardId]?.definitionId;
  if (fixtureCatalog.pearlCards[definitionId]) {
    return "pearl";
  }
  if (fixtureCatalog.characterCards[definitionId]) {
    return "character";
  }
  return "gate";
}

function getCardMeta(state: GameState, cardId: CardInstanceId): string {
  const instance = state.cardsById[cardId];
  const pearl = fixtureCatalog.pearlCards[instance.definitionId];
  if (pearl) {
    return "진주 카드";
  }
  const character = fixtureCatalog.characterCards[instance.definitionId];
  if (character) {
    const score = typeof character.power === "number" ? `점수 ${character.power}` : "점수 미확인";
    const reward =
      typeof character.diamondReward === "number" && character.diamondReward > 0
        ? `다이아 ${character.diamondReward}`
        : "보상 없음";
    return `${score} · ${reward}`;
  }
  return "관문";
}

function getCharacterDefinition(state: GameState, cardId: CardInstanceId) {
  const definitionId = state.cardsById[cardId]?.definitionId;
  return fixtureCatalog.characterCards[definitionId];
}

function getCardImageUrl(state: GameState, cardId: CardInstanceId): string | undefined {
  const instance = state.cardsById[cardId];
  const pearl = fixtureCatalog.pearlCards[instance.definitionId];
  if (pearl) {
    const variant = pearl.hasRefreshIcon === true ? "-refresh" : "";
    return pearlArtUrls[`../assets/cards/pearls/pearl-${pearl.value}${variant}.png`];
  }

  if (fixtureCatalog.characterCards[instance.definitionId]) {
    return (
      characterArtUrls[`../assets/cards/characters/${instance.definitionId}.png`] ??
      characterPlaceholderUrl
    );
  }

  return undefined;
}

function formatRequirement(requirement: CharacterRequirement): string {
  switch (requirement.type) {
    case "exactValues":
      return requirement.values.join("");
    case "sum":
      return `${requirement.count ? `${requirement.count}장으로 ` : ""}합계 ${requirement.total}`;
    case "sequence":
      return `연속 ${requirement.count}장`;
    case "sameValue":
      return `같은 값 ${requirement.count}장`;
    case "odd":
      return `홀수 ${requirement.count}장`;
    case "even":
      return `짝수 ${requirement.count}장`;
    case "custom":
      return requirement.label;
  }
}

function formatStatus(status: "verified" | "candidate" | "placeholder"): string {
  if (status === "verified") {
    return "검증됨";
  }
  if (status === "candidate") {
    return "검증 후보";
  }
  return "프로토타입";
}

function formatPaymentPlan(state: GameState, payment: PaymentPlan): string {
  const diamondByPearlId = new Map(
    payment.diamondUses.map((use) => [use.pearlId, use.diamondId]),
  );
  const overrideByPearlId = new Map(
    (payment.pearlValueOverrides ?? []).map((override) => [override.pearlId, override.value]),
  );
  const pearlLabels = payment.pearlIds
    .map((pearlId) => {
      const pearlLabel = getCardLabel(state, pearlId, fixtureCatalog);
      const override = overrideByPearlId.get(pearlId);
      const valueLabel = override ? `${pearlLabel}→${override}` : pearlLabel;
      return diamondByPearlId.has(pearlId) ? `${valueLabel} + 다이아` : valueLabel;
    });
  const virtualLabels = (payment.virtualPearls ?? []).map((virtualPearl) => {
    const source = getCardLabel(state, virtualPearl.sourceCharacterId, fixtureCatalog);
    return `${source}=진주 ${virtualPearl.value}`;
  });
  const spentDiamondLabels = (payment.spentDiamondIds ?? []).map(() => "다이아 1장");
  return [...pearlLabels, ...virtualLabels, ...spentDiamondLabels].join(", ");
}

function paymentDiamondIds(payment: PaymentPlan): CardInstanceId[] {
  return [
    ...payment.diamondUses.map((use) => use.diamondId),
    ...(payment.spentDiamondIds ?? []),
  ];
}

function usesAnyDiamond(payment: PaymentPlan): boolean {
  return paymentDiamondIds(payment).length > 0;
}

function pickPaymentPlan(
  plans: PaymentPlan[],
  selectedDiamondIds: CardInstanceId[],
): PaymentPlan | null {
  if (plans.length === 0) {
    return null;
  }
  if (selectedDiamondIds.length === 0) {
    return plans[0];
  }
  const selected = new Set(selectedDiamondIds);
  return (
    plans.find((plan) => paymentDiamondIds(plan).some((diamondId) => selected.has(diamondId))) ??
    plans[0]
  );
}

function isPeekAbilityAction(action: GameAction, state: GameState): boolean {
  if (action.type !== "useAbility") {
    return false;
  }
  const sourceCardId = action.choices.sourceCardId;
  if (typeof sourceCardId !== "string") {
    return false;
  }
  const definitionId = state.cardsById[sourceCardId]?.definitionId;
  return Boolean(definitionId && PEEK_CHARACTER_DECK_IDS.has(definitionId));
}

type DetailAction =
  | { type: "placeFromMarket"; marketIndex: number }
  | { type: "selectGateCharacter"; cardId: CardInstanceId };

export function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [setup, setSetup] = useState<GameSetupOptions>({
    ...defaultSetupOptions,
    seed: randomSeed(),
  });
  const [gameState, setGameState] = useState<GameState>(() => createGame(setup));
  const [selectedCardId, setSelectedCardId] = useState<CardInstanceId | null>(null);
  const [selectedDiscardIds, setSelectedDiscardIds] = useState<CardInstanceId[]>([]);
  const [selectedDiamondIds, setSelectedDiamondIds] = useState<CardInstanceId[]>([]);
  const [detailCardId, setDetailCardId] = useState<CardInstanceId | null>(null);
  const [detailAction, setDetailAction] = useState<DetailAction | null>(null);
  const [peekCardId, setPeekCardId] = useState<CardInstanceId | null>(null);
  const [message, setMessage] = useState("게임을 시작할 준비가 되었습니다.");
  const [aiWaiting, setAiWaiting] = useState(false);
  const [highlightCards, setHighlightCards] = useState<CardInstanceId[]>([]);
  const [flash, setFlash] = useState<{ key: number; tone: "gain" | "place" | "activate" | "refresh" | "ai" } | null>(null);
  const [autopilot, setAutopilot] = useState(false);
  const aiTimerRef = useRef<number | null>(null);

  const activePlayer = getActivePlayer(gameState);
  const humanPlayer = gameState.players.find((player) => player.controller.type === "human")!;
  const opponentPlayers = gameState.players.filter((player) => player.controller.type === "ai");
  const activeIsHuman = activePlayer.controller.type === "human";
  const humanHandLimit = getHandLimit(gameState, humanPlayer.id);
  const discardExcessCount = Math.max(0, humanPlayer.pearlHand.length - humanHandLimit);
  const gameEnded = gameState.turn.endGame.status === "ended";
  const discardMode =
    activeIsHuman && gameState.turn.actionsRemaining === 0 && discardExcessCount > 0 && !gameEnded;
  const selectedGateDiscardId =
    selectedCardId && humanPlayer.gateCharacters.includes(selectedCardId)
      ? selectedCardId
      : undefined;
  const actionDisabled =
    !activeIsHuman || aiWaiting || discardMode || gameState.turn.actionsRemaining === 0;
  const seatPositions = getSeatPositions(opponentPlayers.length);

  useEffect(() => {
    if (screen !== "game") {
      return;
    }

    if (gameEnded) {
      if (aiWaiting) setAiWaiting(false);
      setHighlightCards([]);
      return;
    }

    if (activePlayer.controller.type === "human") {
      if (aiWaiting) {
        setAiWaiting(false);
        setHighlightCards([]);
        setMessage("당신의 차례입니다. 행동을 선택하세요.");
      }
    }

    if (activePlayer.controller.type === "human" && autopilot) {
      const humanId = activePlayer.id;
      const timer = window.setTimeout(() => {
        try {
          if (discardMode) {
            const finished = finishTurnIfNeeded(gameState, humanId, { autoDiscard: true });
            setGameState(finished.state);
            setSelectedDiscardIds([]);
            setMessage(`자동: 손패 정리 후 턴 종료`);
            return;
          }
          if (gameState.turn.actionsRemaining > 0) {
            const action = chooseAiAction(gameState, humanId);
            const focus = actionFocusCards(action, gameState);
            setHighlightCards(focus);
            setMessage(`자동: ${describeAction(action, "나")}`);
            setFlash({ key: Date.now(), tone: actionToneOf(action) });
            const result = reduceGame(gameState, action);
            setGameState(result.state);
            return;
          }
          const finished = finishTurnIfNeeded(gameState, humanId);
          setGameState(finished.state);
        } catch (error) {
          setMessage(formatEngineError(error));
        }
      }, 400);
      return () => window.clearTimeout(timer);
    }

    if (activePlayer.controller.type === "human" && gameState.turn.actionsRemaining === 0) {
      const finished = finishTurnIfNeeded(gameState, activePlayer.id, { autoDiscard: false });
      if (finished.events.length > 0) {
        setGameState(finished.state);
        setSelectedCardId(null);
        setSelectedDiscardIds([]);
        setMessage(formatEvents(finished.events));
        return;
      }

      if (discardMode) {
        setMessage(`손패가 ${humanHandLimit}장을 넘었습니다. 버릴 진주 ${discardExcessCount}장을 선택하세요.`);
      }
    }

    if (activePlayer.controller.type === "ai") {
      setAiWaiting(true);
      setMessage(`${actorName(activePlayer)}의 차례입니다. 행동을 결정하는 중...`);

      const aiLabel = actorName(activePlayer);
      const aiId = activePlayer.id;
      const STEP_DELAY = 1700;
      let cancelled = false;

      const timer = window.setTimeout(() => {
        if (cancelled) return;
        try {
          if (gameState.turn.actionsRemaining > 0) {
            const action = chooseAiAction(gameState, aiId);
            const focus = actionFocusCards(action, gameState);
            setHighlightCards(focus);
            setMessage(describeAction(action, aiLabel));
            setFlash({ key: Date.now(), tone: "ai" });
            const result = reduceGame(gameState, action);
            setGameState(result.state);
            return;
          }

          const finished = finishTurnIfNeeded(gameState, aiId);
          setHighlightCards([]);
          setMessage(
            finished.events.length
              ? `${aiLabel}: ${formatEvents(finished.events)}`
              : `${aiLabel}가 턴을 마쳤습니다.`,
          );
          setGameState(finished.state);
        } catch (error) {
          setMessage(formatEngineError(error));
          setAiWaiting(false);
          setHighlightCards([]);
        }
      }, STEP_DELAY);
      aiTimerRef.current = timer;

      return () => {
        cancelled = true;
        window.clearTimeout(timer);
        aiTimerRef.current = null;
      };
    }
  }, [activePlayer, autopilot, discardExcessCount, discardMode, gameState, humanHandLimit, screen]);

  function startGame(nextScreen: Screen = "game") {
    const nextState = createGame(setup);
    setGameState(nextState);
    setSelectedCardId(null);
    setSelectedDiscardIds([]);
    setSelectedDiamondIds([]);
    setDetailCardId(null);
    setDetailAction(null);
    setPeekCardId(null);
    setMessage("새 게임이 시작되었습니다.");
    setScreen(nextScreen);
  }

  function dispatchHumanAction(action: GameAction) {
    if (!activeIsHuman || aiWaiting || discardMode) {
      return;
    }

    try {
      const focus = actionFocusCards(action, gameState);
      const result = reduceGame(gameState, action);
      const peekAction = isPeekAbilityAction(action, gameState);
      const peekedCardId = peekAction
        ? result.state.characterDeck.drawPile[0] ?? null
        : null;
      setGameState(result.state);
      setSelectedCardId(null);
      setSelectedDiscardIds([]);
      if (action.type === "activateGateCharacter") {
        setSelectedDiamondIds((current) =>
          current.filter((diamondId) => !paymentDiamondIds(action.payment).includes(diamondId)),
        );
      }
      setDetailCardId(null);
      setDetailAction(null);
      setPeekCardId(peekedCardId);
      setHighlightCards(focus);
      setFlash({ key: Date.now(), tone: actionToneOf(action) });
      setMessage(
        peekAction
          ? peekedCardId
            ? "인물 더미 맨 위 카드를 확인했습니다."
            : "인물 더미에 확인할 카드가 없습니다."
          : describeAction(action, "나"),
      );
    } catch (error) {
      setMessage(formatEngineError(error));
    }
  }

  function placeCharacterFromMarket(marketIndex: number) {
    if (humanPlayer.gateCharacters.length >= 2 && !selectedGateDiscardId) {
      setMessage("관문 인물 슬롯이 가득 찼습니다. 교체할 인물을 먼저 선택하세요.");
      return;
    }

    dispatchHumanAction({
      type: "placeCharacterFromMarket",
      actorId: activePlayer.id,
      marketIndex,
      discardGateCharacterId: selectedGateDiscardId,
    });
  }

  function placeCharacterFromDeck() {
    if (humanPlayer.gateCharacters.length >= 2 && !selectedGateDiscardId) {
      setMessage("관문 인물 슬롯이 가득 찼습니다. 교체할 인물을 먼저 선택하세요.");
      return;
    }

    dispatchHumanAction({
      type: "placeCharacterFromDeck",
      actorId: activePlayer.id,
      discardGateCharacterId: selectedGateDiscardId,
    });
  }

  function discardSelectedPearls(pearlIds: CardInstanceId[]) {
    try {
      const discardResult = reduceGame(gameState, {
        type: "discardPearlsToLimit",
        actorId: activePlayer.id,
        pearlIds,
      });
      const finished = finishTurnIfNeeded(discardResult.state, activePlayer.id, {
        autoDiscard: false,
      });

      setGameState(finished.state);
      setSelectedCardId(null);
      setSelectedDiscardIds([]);
      setDetailCardId(null);
      setDetailAction(null);
      setMessage(formatEvents([...discardResult.events, ...finished.events]));
    } catch (error) {
      setMessage(formatEngineError(error));
    }
  }

  function toggleDiscardSelection(cardId: CardInstanceId) {
    if (!discardMode || !humanPlayer.pearlHand.includes(cardId)) {
      return;
    }

    const nextSelection = selectedDiscardIds.includes(cardId)
      ? selectedDiscardIds.filter((selectedId) => selectedId !== cardId)
      : [...selectedDiscardIds, cardId];

    if (nextSelection.length > discardExcessCount) {
      setMessage(`버릴 진주는 ${discardExcessCount}장만 선택하세요.`);
      return;
    }

    setSelectedDiscardIds(nextSelection);

    if (nextSelection.length === discardExcessCount) {
      setMessage("선택한 진주를 버리고 턴을 넘깁니다.");
      window.setTimeout(() => discardSelectedPearls(nextSelection), 300);
      return;
    }

    setMessage(`버릴 진주 ${nextSelection.length}/${discardExcessCount}장 선택됨.`);
  }

  function toggleDiamondSelection(cardId: CardInstanceId) {
    if (!activeIsHuman || aiWaiting || discardMode || !humanPlayer.diamonds.includes(cardId)) {
      return;
    }

    setSelectedDiamondIds((current) => {
      const next = current.includes(cardId)
        ? current.filter((selectedId) => selectedId !== cardId)
        : [...current, cardId];
      setMessage(
        next.length > 0
          ? `다이아 ${next.length}장을 결제 후보로 선택했습니다.`
          : "다이아 선택을 해제했습니다.",
      );
      return next;
    });
  }

  function selectCard(cardId: CardInstanceId) {
    if (discardMode && humanPlayer.pearlHand.includes(cardId)) {
      toggleDiscardSelection(cardId);
      return;
    }

    if (aiWaiting) {
      return;
    }

    const nextSelectedCardId = selectedCardId === cardId ? null : cardId;
    setSelectedCardId(nextSelectedCardId);

    if (!nextSelectedCardId) {
      setMessage("선택을 해제했습니다.");
      return;
    }

    if (humanPlayer.gateCharacters.includes(cardId)) {
      setMessage("교체할 관문 인물을 선택했습니다. 새 인물 카드를 선택하세요.");
      return;
    }

    if (humanPlayer.pearlHand.includes(cardId)) {
      setMessage(`선택됨: ${getCardLabel(gameState, cardId, fixtureCatalog)}`);
    }
  }

  function openCharacterDetail(cardId: CardInstanceId, action: DetailAction | null = null) {
    setDetailCardId(cardId);
    setDetailAction(action);
  }

  function inspectOpponentGate(player: PlayerState) {
    const firstGateCard = player.gateCharacters[0] ?? player.activatedCharacters[0];
    if (!firstGateCard) {
      setMessage(`${actorName(player)}의 관문에는 아직 인물이 없습니다.`);
      return;
    }
    openCharacterDetail(firstGateCard);
  }

  function closeCharacterDetail() {
    setDetailCardId(null);
    setDetailAction(null);
  }

  function confirmDetailAction() {
    if (!detailAction) {
      closeCharacterDetail();
      return;
    }

    if (detailAction.type === "placeFromMarket") {
      placeCharacterFromMarket(detailAction.marketIndex);
      return;
    }

    selectCard(detailAction.cardId);
    closeCharacterDetail();
  }

  function activateDetailCharacter(characterId: CardInstanceId, payment: PaymentPlan) {
    dispatchHumanAction({
      type: "activateGateCharacter",
      actorId: activePlayer.id,
      characterInstanceId: characterId,
      payment,
    });
  }

  if (screen === "home") {
    return (
      <main className="opening-screen">
        <section className="opening-content">
          <p className="kicker">혼자 즐기는 몰타의 관문</p>
          <h1>몰타의 관문</h1>
          <p className="opening-copy">
            2명부터 5명까지의 좌석을 구성하고, AI 난이도와 시드를 선택해 로컬에서
            재현 가능한 턴제 게임을 시작합니다.
          </p>
          <div className="opening-actions">
            <button type="button" className="primary-action" onClick={() => startGame()}>
              게임 시작하기
            </button>
            <button type="button" onClick={() => setScreen("settings")}>
              설정하기
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "settings") {
    return (
      <main className="settings-screen">
        <section className="settings-panel">
          <header>
            <p className="kicker">게임 설정</p>
            <h1>플레이 환경</h1>
          </header>

          <label>
            전체 인원
            <select
              value={setup.totalPlayers}
              onChange={(event) =>
                setSetup({
                  ...setup,
                  totalPlayers: Number(event.target.value) as GameSetupOptions["totalPlayers"],
                })
              }
            >
              {playerCounts.map((count) => (
                <option key={count} value={count}>
                  {count}명
                </option>
              ))}
            </select>
          </label>

          <label>
            AI 난이도
            <select
              value={setup.aiDifficulty}
              onChange={(event) =>
                setSetup({ ...setup, aiDifficulty: event.target.value as AiDifficulty })
              }
            >
              {difficulties.map((difficulty) => (
                <option key={difficulty.value} value={difficulty.value}>
                  {difficulty.label}
                </option>
              ))}
            </select>
          </label>

          <p className="setting-note">
            {difficulties.find((difficulty) => difficulty.value === setup.aiDifficulty)?.description}
          </p>

          <label>
            시드
            <input
              value={setup.seed}
              onChange={(event) => setSetup({ ...setup, seed: event.target.value })}
            />
          </label>

          <div className="opening-actions">
            <button type="button" onClick={() => setSetup({ ...setup, seed: randomSeed() })}>
              시드 새로 만들기
            </button>
            <button type="button" className="primary-action" onClick={() => startGame()}>
              이 설정으로 시작
            </button>
            <button type="button" onClick={() => setScreen("home")}>
              돌아가기
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="game-screen">
      <section className="orientation-guard" role="status" aria-live="polite">
        <div className="orientation-device" aria-hidden="true">
          <span />
        </div>
        <div>
          <p className="kicker">화면 방향 안내</p>
          <h1>가로 화면으로 전환해주세요</h1>
          <p>
            모바일과 태블릿에서는 카드와 관문을 한눈에 볼 수 있도록 가로 화면에서
            진행합니다.
          </p>
        </div>
      </section>
      <section className="arena-shell" aria-label="몰타의 관문 전장">
        <div className="status-banner-bar" aria-live="polite">
          <div className={`turn-pill ${activeIsHuman ? "human" : "ai"}`}>
            <span className="turn-pill-label">현재 차례</span>
            <strong>{actorName(activePlayer)}</strong>
            <em>행동 {gameState.turn.actionsRemaining}/3 · 라운드 {gameState.turn.roundNumber}</em>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={message}
              className={`message-banner ${aiWaiting ? "ai-turn" : "human-turn"}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              {aiWaiting ? <span className="ai-spinner" aria-hidden /> : null}
              <span>{message}</span>
            </motion.div>
          </AnimatePresence>
          <button
            type="button"
            className={`reset-game-button${autopilot ? " active" : ""}`}
            onClick={() => setAutopilot((v) => !v)}
            title="자동 진행 토글"
          >
            {autopilot ? "자동 ON" : "자동 OFF"}
          </button>
          <button
            type="button"
            className="reset-game-button"
            onClick={() => {
              setSetup((current) => ({ ...current, seed: randomSeed() }));
              setMessage("새 게임을 준비합니다...");
              setFlash({ key: Date.now(), tone: "refresh" });
              window.setTimeout(() => startGame("game"), 250);
            }}
          >
            새 게임
          </button>
        </div>
        <AnimatePresence>
          {flash ? (
            <motion.div
              key={flash.key}
              className={`screen-flash tone-${flash.tone}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onAnimationComplete={() => {
                window.setTimeout(() => {
                  setFlash((prev) => (prev && prev.key === flash.key ? null : prev));
                }, 320);
              }}
            />
          ) : null}
        </AnimatePresence>
        {gameEnded && gameState.turn.endGame.status === "ended" ? (
          <div className="game-over-overlay" role="dialog" aria-modal="true">
            <div className="game-over-panel">
              <p className="kicker">게임 종료</p>
              <h2>
                {gameState.turn.endGame.winnerIds.includes(humanPlayer.id)
                  ? "당신의 승리!"
                  : "패배"}
              </h2>
              <ul className="scoreboard">
                {gameState.players
                  .map((player) => ({
                    player,
                    power: getPlayerPower(gameState, player.id),
                    diamonds: player.diamonds.length,
                  }))
                  .sort((left, right) =>
                    right.power - left.power || right.diamonds - left.diamonds,
                  )
                  .map(({ player, power, diamonds }) => (
                    <li
                      key={player.id}
                      className={
                        gameState.turn.endGame.status === "ended" &&
                        gameState.turn.endGame.winnerIds.includes(player.id)
                          ? "winner"
                          : ""
                      }
                    >
                      <span>{actorName(player)}</span>
                      <em>
                        점수 {power} · 다이아 {diamonds}
                      </em>
                    </li>
                  ))}
              </ul>
              <button
                type="button"
                className="primary-action"
                onClick={() => {
                  setSetup((current) => ({ ...current, seed: randomSeed() }));
                  setMessage("새 게임을 준비합니다...");
                  window.setTimeout(() => startGame("game"), 200);
                }}
              >
                새 게임
              </button>
            </div>
          </div>
        ) : null}
        <section
          className={`opponent-seat-grid seats-${opponentPlayers.length}`}
          aria-label="상대 좌석"
        >
          {opponentPlayers.map((player, index) => {
            const position = seatPositions[index] ?? "top";
            return (
              <OpponentTableau
                key={player.id}
                player={player}
                state={gameState}
                active={player.id === activePlayer.id}
                position={position}
                highlightCards={highlightCards}
                onGateInspect={openCharacterDetail}
                onActivatedInspect={openCharacterDetail}
                onGateCardClick={() => inspectOpponentGate(player)}
              />
            );
          })}
        </section>

        <section className="battlefield" aria-label="공용 전장">
          <div className="market-board arena-market">
            <MarketLane
              title="열린 진주"
              marker="획득"
              cards={gameState.market.pearlMarket}
              state={gameState}
              selectedCardId={selectedCardId}
              highlightCards={highlightCards}
              disabled={actionDisabled}
              onSelect={selectCard}
              onPlay={(index) =>
                dispatchHumanAction({
                  type: "gainPearlFromMarket",
                  actorId: activePlayer.id,
                  marketIndex: index,
                })
              }
            />
            <MarketLane
              title="열린 인물"
              marker={selectedGateDiscardId ? "교체 배치" : "배치"}
              cards={gameState.market.characterMarket}
              state={gameState}
              selectedCardId={selectedCardId}
              highlightCards={highlightCards}
              disabled={actionDisabled}
              replaceReady={Boolean(selectedGateDiscardId)}
              onSelect={selectCard}
              onPlay={placeCharacterFromMarket}
              onInspect={(cardId, index) =>
                openCharacterDetail(cardId, { type: "placeFromMarket", marketIndex: index })
              }
            />
            <div className="table-actions arena-actions">
              <button
                type="button"
                className="quick-action pearl-action"
                disabled={actionDisabled}
                onClick={() =>
                  dispatchHumanAction({ type: "gainPearlFromDeck", actorId: activePlayer.id })
                }
              >
                <span className="action-icon">◆</span>
                <span>
                  진주 더미
                  <em>비공개 획득</em>
                </span>
              </button>
              <button
                type="button"
                className={`quick-action character-action ${selectedGateDiscardId ? "replace-ready" : ""}`}
                disabled={actionDisabled}
                onClick={placeCharacterFromDeck}
              >
                <span className="action-icon">♟</span>
                <span>
                  인물 더미
                  <em>비공개 배치</em>
                </span>
              </button>
              <button
                type="button"
                className="quick-action refresh-action"
                disabled={actionDisabled}
                onClick={() =>
                  dispatchHumanAction({ type: "refreshPearlMarket", actorId: activePlayer.id })
                }
              >
                <span className="action-icon">↻</span>
                <span>
                  진주 교체
                  <em>시장 갱신</em>
                </span>
              </button>
            </div>
          </div>

        </section>

        <section className={discardMode ? "player-command discard-mode" : "player-command"} aria-label="내 지휘부">
          <PlayerField
            player={humanPlayer}
            state={gameState}
            active={humanPlayer.id === activePlayer.id}
            variant="player"
            selectedCardId={selectedCardId}
            highlightCards={highlightCards}
            onGateInspect={(cardId) =>
              openCharacterDetail(cardId, { type: "selectGateCharacter", cardId })
            }
            onActivatedInspect={openCharacterDetail}
            canQuickActivate={activeIsHuman && !aiWaiting && !discardMode && gameState.turn.actionsRemaining > 0}
            onQuickActivate={activateDetailCharacter}
            selectedDiamondIds={selectedDiamondIds}
            onDiamondToggle={toggleDiamondSelection}
          />
          <section className="hand-zone">
            <header>
              <h2>내 손패</h2>
              <span className={discardMode ? "hand-limit over" : "hand-limit"}>
                {humanPlayer.pearlHand.length}/{humanHandLimit}
              </span>
            </header>
            {discardMode ? (
              <p className="discard-warning">
                버릴 진주 {selectedDiscardIds.length}/{discardExcessCount}장을 선택하면 자동으로 턴이 넘어갑니다.
              </p>
            ) : null}
            <div className="hand-row">
              {humanPlayer.pearlHand.length === 0 ? (
                <p className="empty-copy">아직 손에 든 진주가 없습니다.</p>
              ) : (
                <LayoutGroup>
                  <AnimatePresence mode="popLayout">
                    {humanPlayer.pearlHand.map((cardId, index) => {
                      const middle = (humanPlayer.pearlHand.length - 1) / 2;
                      const distance = index - middle;
                      return (
                        <GameCard
                          key={cardId}
                          cardId={cardId}
                          state={gameState}
                          selected={selectedCardId === cardId || selectedDiscardIds.includes(cardId)}
                          highlight={highlightCards.includes(cardId)}
                          className={selectedDiscardIds.includes(cardId) ? "discard-selected" : ""}
                          style={
                            {
                              "--fan-tilt": `${distance * 5}deg`,
                              "--fan-rise": `${Math.abs(distance) * 8}px`,
                            } as CSSProperties
                          }
                          onClick={() => selectCard(cardId)}
                        />
                      );
                    })}
                  </AnimatePresence>
                </LayoutGroup>
              )}
            </div>
          </section>
        </section>

        {detailCardId ? (
          <CardDetailOverlay
            cardId={detailCardId}
            state={gameState}
            action={detailAction}
            onClose={closeCharacterDetail}
            onConfirm={confirmDetailAction}
            humanPlayerId={humanPlayer.id}
            isOnHumanGate={humanPlayer.gateCharacters.includes(detailCardId)}
            isHumanActivated={humanPlayer.activatedCharacters.includes(detailCardId)}
            canActivate={activeIsHuman && !aiWaiting && !discardMode && gameState.turn.actionsRemaining > 0}
            onActivate={activateDetailCharacter}
            canUseAbility={activeIsHuman && !aiWaiting && !discardMode}
            onUseAbility={dispatchHumanAction}
            selectedDiamondIds={selectedDiamondIds}
          />
        ) : null}
        {peekCardId ? (
          <PeekCharacterOverlay
            cardId={peekCardId}
            state={gameState}
            canPlace={activeIsHuman && !aiWaiting && !discardMode && gameState.turn.actionsRemaining > 0}
            needsReplacement={humanPlayer.gateCharacters.length >= 2 && !selectedGateDiscardId}
            onClose={() => setPeekCardId(null)}
            onPlace={() => {
              setPeekCardId(null);
              placeCharacterFromDeck();
            }}
          />
        ) : null}
      </section>
    </main>
  );
}

type MarketLaneProps = {
  title: string;
  marker: string;
  cards: CardInstanceId[];
  state: GameState;
  selectedCardId: CardInstanceId | null;
  highlightCards?: CardInstanceId[];
  disabled: boolean;
  replaceReady?: boolean;
  onSelect: (cardId: CardInstanceId) => void;
  onPlay: (index: number) => void;
  onInspect?: (cardId: CardInstanceId, index: number) => void;
};

function MarketLane({
  title,
  marker,
  cards,
  state,
  selectedCardId,
  highlightCards,
  disabled,
  replaceReady = false,
  onSelect,
  onPlay,
  onInspect,
}: MarketLaneProps) {
  const highlightSet = new Set(highlightCards ?? []);
  return (
    <section className={replaceReady ? "market-lane replace-ready" : "market-lane"}>
      <header>
        <h2>{title}</h2>
        <span>{marker}</span>
      </header>
      <div className="battlefield-row">
        <LayoutGroup>
          <AnimatePresence mode="popLayout">
            {cards.map((cardId, index) => (
              <GameCard
                key={cardId}
                cardId={cardId}
                state={state}
                selected={selectedCardId === cardId}
                highlight={highlightSet.has(cardId)}
                disabled={disabled}
                onClick={() => {
                  if (onInspect && getCardKind(state, cardId) === "character") {
                    onInspect(cardId, index);
                    return;
                  }
                  onSelect(cardId);
                  onPlay(index);
                }}
              />
            ))}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </section>
  );
}

function OpponentTableau({
  player,
  state,
  active,
  position,
  highlightCards,
  onGateInspect,
  onActivatedInspect,
  onGateCardClick,
}: {
  player: PlayerState;
  state: GameState;
  active: boolean;
  position: SeatPosition;
  highlightCards?: CardInstanceId[];
  onGateInspect: (cardId: CardInstanceId) => void;
  onActivatedInspect: (cardId: CardInstanceId) => void;
  onGateCardClick: () => void;
}) {
  const fanLength = Math.min(player.pearlHand.length, 8);
  return (
    <section
      className={["opponent-tableau", `seat-${position}`, active ? "active" : ""]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${actorName(player)} 자리`}
    >
      <div
        className="opponent-hand-fan"
        aria-label={`${actorName(player)} 숨김 손패`}
      >
        {Array.from({ length: fanLength }, (_, index) => (
          <div
            key={index}
            className="card-back fan-back"
            style={
              {
                "--fan-tilt": `${(index - (fanLength - 1) / 2) * 6}deg`,
                "--fan-shift": `${(index - (fanLength - 1) / 2) * 18}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <HeroBadge
        player={player}
        state={state}
        active={active}
        position="opponent"
        onGateCardClick={onGateCardClick}
      />
      <PlayerField
        player={player}
        state={state}
        active={active}
        variant="opponent"
        selectedCardId={null}
        highlightCards={highlightCards}
        onGateInspect={onGateInspect}
        onActivatedInspect={onActivatedInspect}
        onGateCardClick={onGateCardClick}
      />
    </section>
  );
}

function PlayerField({
  player,
  state,
  active,
  variant,
  selectedCardId,
  highlightCards,
  onGateInspect,
  onActivatedInspect,
  onQuickActivate,
  canQuickActivate,
  selectedDiamondIds = [],
  onDiamondToggle,
  onGateCardClick,
}: {
  player: PlayerState;
  state: GameState;
  active: boolean;
  variant: "opponent" | "player";
  selectedCardId: CardInstanceId | null;
  highlightCards?: CardInstanceId[];
  onGateInspect: (cardId: CardInstanceId) => void;
  onActivatedInspect: (cardId: CardInstanceId) => void;
  onQuickActivate?: (characterId: CardInstanceId, payment: PaymentPlan) => void;
  canQuickActivate?: boolean;
  selectedDiamondIds?: CardInstanceId[];
  onDiamondToggle?: (cardId: CardInstanceId) => void;
  onGateCardClick?: () => void;
}) {
  const activeSlots = Math.max(3, player.activatedCharacters.length);
  const highlightSet = new Set(highlightCards ?? []);
  const score = getPlayerPower(state, player.id);

  return (
    <section className={["player-field", variant, active ? "active" : ""].filter(Boolean).join(" ")}>
      <header>
        <strong>{actorName(player)}</strong>
        <span>
          점수 {score} · 다이아 {player.diamonds.length}
        </span>
      </header>
      {player.diamonds.length > 0 ? (
        <div className="diamond-bank" aria-label={`${actorName(player)} 다이아`}>
          {player.diamonds.map((diamondId, index) => {
            const selected = selectedDiamondIds.includes(diamondId);
            const interactive = Boolean(onDiamondToggle);
            return interactive ? (
              <button
                type="button"
                key={diamondId}
                className={selected ? "diamond-chip selected" : "diamond-chip"}
                aria-pressed={selected}
                title="결제에 사용할 다이아 선택"
                onClick={() => onDiamondToggle?.(diamondId)}
              >
                ◇<span>{index + 1}</span>
              </button>
            ) : (
              <span key={diamondId} className="diamond-chip">
                ◇<span>{index + 1}</span>
              </span>
            );
          })}
        </div>
      ) : null}
      <div className="player-field-grid">
        <section className="field-section gate-field" aria-label={`${actorName(player)} 관문`}>
          <span className="field-label">관문</span>
          <GateIdentityCard
            label={`${actorName(player)} 관문`}
            opponent={variant === "opponent"}
            onClick={onGateCardClick}
          />
          <div className="field-card-row gate-card-row">
            <LayoutGroup>
              <AnimatePresence mode="popLayout">
                {[0, 1].map((slot) => {
                  const cardId = player.gateCharacters[slot];
                  const paymentPlan =
                    cardId && onQuickActivate
                      ? getPaymentPlans(state, player.id, cardId)[0] ?? null
                      : null;
                  const quickEnabled = Boolean(canQuickActivate && cardId && paymentPlan);
                  return (
                    <div key={slot} className="field-card-slot">
                      {cardId ? (
                        <>
                          <GameCard
                            cardId={cardId}
                            state={state}
                            selected={selectedCardId === cardId}
                            highlight={highlightSet.has(cardId)}
                            className={
                              selectedCardId === cardId
                                ? "replace-target field-card"
                                : "field-card"
                            }
                            onClick={() => onGateInspect(cardId)}
                          />
                          {onQuickActivate ? (
                            <button
                              type="button"
                              className="quick-activate-button"
                              disabled={!quickEnabled}
                              title={
                                quickEnabled
                                  ? "손패 진주와 다이아로 즉시 활성화"
                                  : "활성화에 필요한 진주가 부족합니다"
                              }
                              onClick={(event) => {
                                event.stopPropagation();
                                if (paymentPlan) {
                                  onQuickActivate(cardId, paymentPlan);
                                }
                              }}
                            >
                              활성화
                            </button>
                          ) : null}
                        </>
                      ) : (
                        <span>빈 관문</span>
                      )}
                    </div>
                  );
                })}
              </AnimatePresence>
            </LayoutGroup>
          </div>
        </section>

        <section className="field-section activated-field" aria-label={`${actorName(player)} 활성 인물`}>
          <span className="field-label">활성 인물</span>
          <div className="field-card-row activated-card-row">
            <LayoutGroup>
              <AnimatePresence mode="popLayout">
                {Array.from({ length: activeSlots }, (_, index) => {
                  const cardId = player.activatedCharacters[index];
                  return (
                    <div key={cardId ?? `empty-${index}`} className="field-card-slot activated-slot">
                      {cardId ? (
                        <GameCard
                          cardId={cardId}
                          state={state}
                          selected={false}
                          highlight={highlightSet.has(cardId)}
                          className="field-card activated-card"
                          onClick={() => onActivatedInspect(cardId)}
                        />
                      ) : (
                        <span>빈 활성</span>
                      )}
                    </div>
                  );
                })}
              </AnimatePresence>
            </LayoutGroup>
          </div>
        </section>
      </div>
    </section>
  );
}

function HeroBadge({
  player,
  state,
  active,
  position,
  onGateCardClick,
}: {
  player: PlayerState;
  state: GameState;
  active: boolean;
  position: "opponent" | "player";
  onGateCardClick?: () => void;
}) {
  return (
    <section className={["hero-badge", position, active ? "active" : ""].join(" ")}>
      <div className="hero-portrait">
        <span>{actorName(player)}</span>
      </div>
      <div className="hero-name">
        <strong>{actorName(player)}</strong>
        <span>
          점수 {getPlayerPower(state, player.id)} · 다이아 {player.diamonds.length}
        </span>
      </div>
      <div className="hero-gate-card">
        <GateIdentityCard
          label={`${actorName(player)} 관문`}
          opponent={position === "opponent"}
          onClick={onGateCardClick}
        />
      </div>
    </section>
  );
}

function CardDetailOverlay({
  cardId,
  state,
  action,
  onClose,
  onConfirm,
  humanPlayerId,
  isOnHumanGate,
  isHumanActivated,
  canActivate,
  onActivate,
  canUseAbility,
  onUseAbility,
  selectedDiamondIds,
}: {
  cardId: CardInstanceId;
  state: GameState;
  action: DetailAction | null;
  onClose: () => void;
  onConfirm: () => void;
  humanPlayerId: PlayerId;
  isOnHumanGate: boolean;
  isHumanActivated: boolean;
  canActivate: boolean;
  onActivate: (characterId: CardInstanceId, payment: PaymentPlan) => void;
  canUseAbility: boolean;
  onUseAbility: (action: GameAction) => void;
  selectedDiamondIds: CardInstanceId[];
}) {
  const definition = getCharacterDefinition(state, cardId);
  const imageUrl = getCardImageUrl(state, cardId);

  if (!definition) {
    return null;
  }

  const reward =
    typeof definition.diamondReward === "number" && definition.diamondReward > 0
      ? `다이아 ${definition.diamondReward}`
      : "보상 없음";
  const effectText = definition.abilities.length
    ? definition.abilities.map((ability) => ability.text).join("\n")
    : "효과 없음";
  const confirmLabel =
    action?.type === "placeFromMarket"
      ? "배치"
      : action?.type === "selectGateCharacter"
        ? "교체 대상으로 선택"
        : "";

  const paymentPlans = isOnHumanGate ? getPaymentPlans(state, humanPlayerId, cardId) : [];
  const paymentPlan = pickPaymentPlan(paymentPlans, selectedDiamondIds);
  const paymentLabel = paymentPlan ? formatPaymentPlan(state, paymentPlan) : "";
  const activationDisabled = !canActivate || !paymentPlan;
  const activationUsesDiamonds = paymentPlan ? usesAnyDiamond(paymentPlan) : false;
  const abilityAction = isHumanActivated
    ? getUsableAbilityActions(state, humanPlayerId).find(
        (candidate) =>
          candidate.type === "useAbility" && candidate.choices.sourceCardId === cardId,
      ) ?? null
    : null;

  return (
    <section className="card-detail-backdrop" role="dialog" aria-modal="true" aria-label="인물 카드 상세">
      <div className="card-detail-panel">
        <button type="button" className="detail-close-button" aria-label="닫기" onClick={onClose}>
          ×
        </button>
        <div className="detail-card-column">
          <div className="detail-card-preview">
            {imageUrl ? <img src={imageUrl} alt="" /> : null}
          </div>
          <div className="detail-actions">
            {confirmLabel ? (
              <button type="button" className="primary-action" onClick={onConfirm}>
                {confirmLabel}
              </button>
            ) : null}
            {isOnHumanGate ? (
              <button
                type="button"
                className="primary-action"
                disabled={activationDisabled}
                onClick={() => {
                  if (paymentPlan) {
                    onActivate(cardId, paymentPlan);
                  }
                }}
              >
                {activationUsesDiamonds ? "다이아로 활성화" : "활성화"}
              </button>
            ) : null}
            {abilityAction ? (
              <button
                type="button"
                className="primary-action"
                disabled={!canUseAbility}
                onClick={() => onUseAbility(abilityAction)}
              >
                효과 사용
              </button>
            ) : null}
            <button type="button" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
        <div className="detail-copy">
          <header className="detail-header">
            <span className="kicker">인물 카드</span>
            <span>{formatStatus(definition.status)}</span>
          </header>
          <section className="detail-effect">
            <span>효과</span>
            <strong>{effectText}</strong>
          </section>
          <dl className="detail-stats">
            <div>
              <dt>조건</dt>
              <dd>{formatRequirement(definition.requirement)}</dd>
            </div>
            <div>
              <dt>점수</dt>
              <dd>{typeof definition.power === "number" ? definition.power : "미확인"}</dd>
            </div>
            <div>
              <dt>보상</dt>
              <dd>{reward}</dd>
            </div>
          </dl>
          {isOnHumanGate ? (
            <section className="detail-payment">
              <span>지불 진주</span>
              {paymentPlan ? (
                <strong>{paymentLabel}</strong>
              ) : (
                <strong>손패로 조건 충족 불가</strong>
              )}
            </section>
          ) : null}
          {selectedDiamondIds.length > 0 ? (
            <section className="detail-payment diamond-selection">
              <span>선택한 다이아</span>
              <strong>{selectedDiamondIds.length}장</strong>
            </section>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function PeekCharacterOverlay({
  cardId,
  state,
  canPlace,
  needsReplacement,
  onClose,
  onPlace,
}: {
  cardId: CardInstanceId;
  state: GameState;
  canPlace: boolean;
  needsReplacement: boolean;
  onClose: () => void;
  onPlace: () => void;
}) {
  const definition = getCharacterDefinition(state, cardId);
  const imageUrl = getCardImageUrl(state, cardId);

  if (!definition) {
    return null;
  }

  return (
    <section className="card-detail-backdrop" role="dialog" aria-modal="true" aria-label="인물 더미 미리보기">
      <div className="card-detail-panel peek-panel">
        <button type="button" className="detail-close-button" aria-label="닫기" onClick={onClose}>
          ×
        </button>
        <div className="detail-card-column">
          <div className="detail-card-preview">
            {imageUrl ? <img src={imageUrl} alt="" /> : null}
          </div>
          <div className="detail-actions">
            <button
              type="button"
              className="primary-action"
              disabled={!canPlace || needsReplacement}
              onClick={onPlace}
            >
              배치
            </button>
            <button type="button" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
        <div className="detail-copy">
          <header className="detail-header">
            <span className="kicker">인물 더미 맨 위</span>
            <span>{formatStatus(definition.status)}</span>
          </header>
          <section className="detail-effect">
            <span>효과</span>
            <strong>
              {definition.abilities.length
                ? definition.abilities.map((ability) => ability.text).join("\n")
                : "효과 없음"}
            </strong>
          </section>
          <dl className="detail-stats">
            <div>
              <dt>조건</dt>
              <dd>{formatRequirement(definition.requirement)}</dd>
            </div>
            <div>
              <dt>점수</dt>
              <dd>{typeof definition.power === "number" ? definition.power : "미확인"}</dd>
            </div>
            <div>
              <dt>보상</dt>
              <dd>
                {typeof definition.diamondReward === "number" && definition.diamondReward > 0
                  ? `다이아 ${definition.diamondReward}`
                  : "보상 없음"}
              </dd>
            </div>
          </dl>
          {needsReplacement ? (
            <section className="detail-payment">
              <span>배치 불가</span>
              <strong>관문이 가득 찼습니다. 교체할 인물을 먼저 선택하세요.</strong>
            </section>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function GateIdentityCard({
  label,
  opponent = false,
  onClick,
}: {
  label: string;
  opponent?: boolean;
  onClick?: () => void;
}) {
  const className = [
    opponent ? "gate-identity-card opponent" : "gate-identity-card",
    onClick ? "clickable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span>관문 카드</span>
      <strong>{label}</strong>
      <em>{opponent ? "클릭 가능" : "항상 공개"}</em>
    </>
  );

  return onClick ? (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

function GameCard({
  cardId,
  state,
  selected,
  disabled = false,
  highlight = false,
  className = "",
  style,
  onClick,
}: {
  cardId: CardInstanceId;
  state: GameState;
  selected: boolean;
  disabled?: boolean;
  highlight?: boolean;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  const kind = getCardKind(state, cardId);
  const imageUrl = getCardImageUrl(state, cardId);
  const label = getCardLabel(state, cardId, fixtureCatalog);
  return (
    <motion.button
      type="button"
      layoutId={`card-${cardId}`}
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.6 }}
      className={[
        "molta-card",
        kind,
        kind === "character" && !disabled ? "inspectable" : "",
        selected ? "selected" : "",
        highlight ? "focus-highlight" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={label}
      style={style}
      onClick={onClick}
    >
      <span className="card-title">{label}</span>
      <span className="card-art">{imageUrl ? <img src={imageUrl} alt="" /> : null}</span>
      <span className="card-meta">{getCardMeta(state, cardId)}</span>
    </motion.button>
  );
}
