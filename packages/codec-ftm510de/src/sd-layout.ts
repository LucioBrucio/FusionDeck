import type { SdCardLayout } from '@fusiondeck/core';

/**
 * Fixed SD-card paths the FTM-510DE reads/writes (§5.1, from the ADMS-18
 * manual). The radio populates these via menu `107 BACKUP → WRITE TO SD`.
 */
export const FTM510DE_SD_LAYOUT: SdCardLayout = {
  memoryChannels: 'FTM510D_MEMORY-CH/MEMFTM510D.dat',
  clone: 'FTM510D/BACKUP/CLNFTM510D.dat',
  system: 'FTM510D/BACKUP/SYSFTM510D.dat',
};
