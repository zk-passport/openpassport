import { ethers } from 'ethers'
import { create } from 'zustand'
import { Proof } from '../../../common/src/utils/types'

interface GitcoinState {
  address: string
  majority: number
  ens: string
  disclosure: {
    nationality: boolean
    expiry_date: boolean
    older_than: boolean
  }

  proof: Proof | null
  proofTime: number | null

  proofSentText: string
  txHash: string

  appAlreadyUsed: boolean

  update: (patch: any) => void
  cleanAppState: () => void
}

const useGitcoinStore = create<GitcoinState>((set, get) => ({
  address: ethers.ZeroAddress,
  majority: 18,
  ens: "",
  disclosure: {
    nationality: false,
    expiry_date: false,
    older_than: false,
  },

  proof: null,
  proofTime: null,

  proofSentText: "",
  txHash: "",

  appAlreadyUsed: false,

  update: (patch) => {
    set({
      ...get(),
      ...patch,
    });
  },

  cleanAppState: () => set({}, true),
}))

export default useGitcoinStore