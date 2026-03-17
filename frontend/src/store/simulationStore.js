import { create } from 'zustand'

const useSimulationStore = create((set) => ({
  simulations: [],
  currentSimulation: null,
  ticks: [],
  isRunning: false,

  addTick: (tick) => set((state) => ({ ticks: [...state.ticks, tick] })),
  setCurrentSimulation: (sim) => set({ currentSimulation: sim, ticks: [], isRunning: true }),
  setIsRunning: (val) => set({ isRunning: val }),
  addSimulation: (sim) => set((state) => ({ simulations: [...state.simulations, sim] })),
}))

export default useSimulationStore
