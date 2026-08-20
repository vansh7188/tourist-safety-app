import { useContext } from "react";
import { EmergencyContext } from "./EmergencyContextValue";

export const useEmergency = () => useContext(EmergencyContext);
