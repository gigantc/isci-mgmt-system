/**
 * Matrix filenames use ISCIz's filename format (app/utils/fileName.js).
 */

import { buildFileName } from "../../../../utils/fileName.js";

// campaign is only included when the producer chose to. Segments with no value
// (a radio spot has no aspect ratio) are dropped instead of shown as "[Label]".
export const buildMatrixFileName = ({ code, brandName, campaignName, includeCampaign, row, placementName }) =>
  buildFileName(
    {
      code,
      brand: brandName,
      campaignName: includeCampaign ? campaignName : "",
      spotTitle: row.spotTitle,
      language: row.language,
      spotLength: row.spotLength,
      aspectRatio: row.aspectRatio,
      placementName,
    },
    { skipEmpty: true }
  );
