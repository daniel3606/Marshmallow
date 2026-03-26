import {
  createBlockingSession,
  completeBlockingSession,
  fetchMarshmallow,
  updateMarshmallow,
  updateStreak,
} from "@/lib/database";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

interface MarshmallowState {
  name: string;
  color: string;
  sizeCm: number;
  isBlocking: boolean;
  blockEndTime: number | null;
  totalBlockedMinutes: number;
  nameChangesUsed: number;
  colorChangesUsed: number;
  loaded: boolean;
}

interface MarshmallowContextType {
  state: MarshmallowState;
  setupMarshmallow: (name: string, color: string) => Promise<void>;
  startBlocking: (endTime: number, growthRate?: number) => void;
  completeBlocking: (minutesBlocked: number, growthRate?: number) => Promise<void>;
  cancelBlocking: () => void;
  changeName: (name: string) => Promise<void>;
  changeColor: (color: string) => Promise<void>;
  refresh: () => Promise<void>;
  activeSessionId: string | null;
}

const defaultState: MarshmallowState = {
  name: "",
  color: "#FFB5C2",
  sizeCm: 1,
  isBlocking: false,
  blockEndTime: null,
  totalBlockedMinutes: 0,
  nameChangesUsed: 0,
  colorChangesUsed: 0,
  loaded: false,
};

const MarshmallowContext = createContext<MarshmallowContextType>({
  state: defaultState,
  setupMarshmallow: async () => {},
  startBlocking: () => {},
  completeBlocking: async () => {},
  cancelBlocking: () => {},
  changeName: async () => {},
  changeColor: async () => {},
  refresh: async () => {},
  activeSessionId: null,
});

export function MarshmallowProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [state, setState] = useState<MarshmallowState>(defaultState);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const loadFromDB = useCallback(async () => {
    if (!session?.user?.id) {
      setState(defaultState);
      return;
    }

    try {
      const marshmallow = await fetchMarshmallow(session.user.id);
      setState((prev) => ({
        ...prev,
        name: marshmallow.name,
        color: marshmallow.color,
        sizeCm: Number(marshmallow.size_cm),
        totalBlockedMinutes: marshmallow.total_blocked_minutes,
        nameChangesUsed: marshmallow.name_changes_used,
        colorChangesUsed: marshmallow.color_changes_used,
        loaded: true,
      }));
    } catch {
      setState((prev) => ({ ...prev, loaded: true }));
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadFromDB();
  }, [loadFromDB]);

  const setupMarshmallow = async (name: string, color: string) => {
    setState((prev) => ({ ...prev, name, color }));

    if (session?.user?.id) {
      try {
        await updateMarshmallow(session.user.id, { name, color });
      } catch (err) {
        console.error("Failed to save marshmallow setup:", err);
      }
    }
  };

  const startBlocking = (endTime: number, growthRate: number = 1.0) => {
    setState((prev) => ({ ...prev, isBlocking: true, blockEndTime: endTime }));

    if (session?.user?.id) {
      const durationMinutes = Math.round((endTime - Date.now()) / 60000);
      createBlockingSession(session.user.id, durationMinutes)
        .then((session) => setActiveSessionId(session.id))
        .catch((err) => console.error("Failed to create blocking session:", err));
    }
  };

  const completeBlocking = async (minutesBlocked: number, growthRate: number = 1.0) => {
    const growthCm = (minutesBlocked / 30) * growthRate;
    const newSizeCm = Math.round((state.sizeCm + growthCm) * 10) / 10;
    const newTotalMinutes = state.totalBlockedMinutes + minutesBlocked;

    setState((prev) => ({
      ...prev,
      isBlocking: false,
      blockEndTime: null,
      sizeCm: newSizeCm,
      totalBlockedMinutes: newTotalMinutes,
    }));

    if (session?.user?.id) {
      try {
        await updateMarshmallow(session.user.id, {
          size_cm: newSizeCm,
          total_blocked_minutes: newTotalMinutes,
        });

        if (activeSessionId) {
          await completeBlockingSession(activeSessionId, minutesBlocked, growthCm);
          setActiveSessionId(null);
        }

        // Update streak on completed session
        await updateStreak(session.user.id);
      } catch (err) {
        console.error("Failed to sync completion:", err);
      }
    }
  };

  const cancelBlocking = () => {
    setState((prev) => ({
      ...prev,
      isBlocking: false,
      blockEndTime: null,
    }));
    setActiveSessionId(null);
  };

  const changeName = async (name: string) => {
    if (!session?.user?.id) return;
    const newCount = state.nameChangesUsed + 1;
    setState((prev) => ({ ...prev, name, nameChangesUsed: newCount }));
    await updateMarshmallow(session.user.id, {
      name,
      name_changes_used: newCount,
    });
  };

  const changeColor = async (color: string) => {
    if (!session?.user?.id) return;
    const newCount = state.colorChangesUsed + 1;
    setState((prev) => ({ ...prev, color, colorChangesUsed: newCount }));
    await updateMarshmallow(session.user.id, {
      color,
      color_changes_used: newCount,
    });
  };

  return (
    <MarshmallowContext.Provider
      value={{
        state,
        setupMarshmallow,
        startBlocking,
        completeBlocking,
        cancelBlocking,
        changeName,
        changeColor,
        refresh: loadFromDB,
        activeSessionId,
      }}
    >
      {children}
    </MarshmallowContext.Provider>
  );
}

export function useMarshmallow() {
  return useContext(MarshmallowContext);
}
