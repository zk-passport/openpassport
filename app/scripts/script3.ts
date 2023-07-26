import * as crypto from 'crypto';

// On a la donnée de base :
// Pas besoin de faire ça, on va pas prouver l'image pour l'instant

const dg2InSave = {
  buffer: [
    127, 41, 40, -118, 2, -112, -1, -39, -19, -19, 105, -71, -45, 50, 40, 106,
    53, -53, 70, 125, -69, 14, -50, 127, -91, -81, 110, -74, 44, -38, 92, 37,
    -8, -64, 126, -88, -84, 127, -122, -118, -65, -92, 15, 63, 28, 39, 13, 42,
    125, 54, -107, 2, -97, 100, 117, -38, 1, 27, 61, 79, -118, -104, 31, 99, 29,
    -94, 12, -16, -27, -46, -40, -127, 7, -1, 53, -90, 33, 63, 105, -33, 119,
    -81, 107, 119, -105, 48, 20, -13, -74, 112, -30, -106, 39, -10, -29, -112,
    -17, -2, 54, -9, -115, -16, 75, 104, 103, 94, 87, -60, -82, 13, 92, -16, 9,
    -38, 17, -101, -95, 125, 121, 70, -104, -120, 58, 51, -108, -125, 40, 48,
    -57, 88, -112, 95, -52, 69, 26, -62, -22, 94, -35, -104, -88, 28, 61, 87,
    -126, -60, -70, -22, 19, 122, -19, 30, -3, -109, -32, 18, -15, -3, 4, -116,
    -19, 112, -85, 121, -17, -60, -128, -28, 14, -85, -85, 0, -19, 62, 14, 95,
    63, -40, 77, -27, 6, 78, -47, 93, -33, -7, 61, -46, -126, 120, 1, 67, -38,
    74, 45, 96, 54, -67, 40, -1, -124, 33, -15, 63, -111, 119, 66, 106, -21,
    -46, -107, 75, -37, -114, 111, 48, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  bufferLength: 8,
  fileLength: 13814,
  fs: {
    fidToSFI: {
      '257': 1,
      '258': 2,
      '259': 3,
      '260': 4,
      '261': 5,
      '262': 6,
      '263': 7,
      '264': 8,
      '265': 9,
      '266': 10,
      '267': 11,
      '268': 12,
      '269': 13,
      '270': 14,
      '271': 15,
      '272': 16,
      '284': 28,
      '285': 29,
      '286': 30,
    },
    fileInfos: {
      '257': [Object],
      '258': [Object],
      '270': [Object],
      '285': [Object],
    },
    isSFIEnabled: false,
    isSelected: true,
    selectedFID: 270,
    service: {secureMessagingSender: [Object], service: [Object]},
    wrapper: {
      ksEnc: [Object],
      ksMac: [Object],
      maxTranceiveLength: 256,
      shouldCheckMAC: false,
      ssc: 0,
    },
  },
  markedOffset: -1,
  offsetBufferInFile: 13806,
  offsetInBuffer: 8,
  path: [{buffer: [Object], fid: 258}],
};

const photo = {
  base64:
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gIoSUNDX1BST0ZJTEUAAQEAAAIYAAAAAAIQAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAHRyWFlaAAABZAAAABRnWFlaAAABeAAAABRiWFlaAAABjAAAABRyVFJDAAABoAAAAChnVFJDAAABoAAAAChiVFJDAAABoAAAACh3dHB0AAAByAAAABRjcHJ0AAAB3AAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAFgAAAAcAHMAUgBHAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z3BhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABYWVogAAAAAAAA9tYAAQAAAADTLW1sdWMAAAAAAAAAAQAAAAxlblVTAAAAIAAAABwARwBvAG8AZwBsAGUAIABJAG4AYwAuACAAMgAwADEANv/bAEMA///////////////////////////////////////////////////////////////////////////////////////bAEMB///////////////////////////////////////////////////////////////////////////////////////AABEIAUAA8AMBIgACEQEDEQH/xAAXAAEBAQEAAAAAAAAAAAAAAAAAAQID/8QAIRABAQABAwQDAQAAAAAAAAAAAAERAhJhMYGh8CFB0VH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAf/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ANmRAXJlFAAAAAAAAAAAEAUQBcmUAXJlAFyIAogCiAKIAqKgCoAoAAACKgKIAAAAAAAAAAAAAAAAAAAqKAgKAigAIADFoN5kZ3MgLupuqANbqu5gB0zBzMg6DE1YbAAAAAAAAAABQQAAFEAAtc7bQW3LIAAAAAAAAALLhAHSVXJqXANhLkAAAAAABQAQFBALcAzqv0wdQAAAAAAAAAAAFBBcICyukuXNZcA2AAAACgIqAAAMar9NuYIAAAAAALhcAyq4XAMmGsAJhcKAmEsaKDCNVkG9N+mnJ0lzAUABUUBFQAAC9HJvV0YAAAFMZBMNyEigAIoKAgoCKigIqKJWHRiiI1prIDqEAAABUAABjV1Zb1MAA1AMNIoAACoCqIAoggAKAAgxW2KCAsB0nQJ0AAAUEBUAGdTC6rmoBG2Z1aBREBcmWcGAayZZUGhAVUyIIZMphcAZXKAKzWkoMrIjpOgKAAACgAIqAxq+mWtXVkFjTMaATKpATItiSAKAKqKKyKgiCpgF5MqmAVKqUEb09HN009AUAAAFAARUBnVPth0vRzoLG2I0AKAiKAigAqKKgAIoCAKAzWmaCRudGI6QAAAAFRQBFARit1kGY0z0aBQBUFAQABUUEAAVFABAGa0n2ISNsxoAAAAFAARUASxQGaLhAFQBUAUBKCjKiKMqKoAAAgDUAgAAAAAKAAigIAAipQQAAAAAEFQFEUUAAAEGmY0AAAAAACgAIqAAAAAyLUABAPkAE+RQEUAFQBQAWKAAAAAAAKAAioAAAADNv0jOfloFEABQEFAQUBAAFlRJfkHQAAAAAAAFQAAAAS3AKl6VjdUttBGpWQGxnKgqoAqACoAAiZAtQAdZ0ipLmKAAAAAAACWyAqZwxdX8QGrq/jAAAAAAAA1KrC5BpEyZBTKZQFQAAAGpq/rIDqrlLY3NQNAAAAxdX8YAAAAAAAAAAAAAAAAAAAAAAAAAFlsdJcuQDsMTV/W5cg4jrsnPvY2Tn3sDkOuyc+9jZOfH4DkOuyc+9jZOfH4DkOuyc+9jZOfewOQ67Jz72Nk597A5DrsnPj8Nk58fgOQ67Jz72Nk597A5DrsnPvY2Tnx+A5DrsnPj8Nk58fgOQ67Jz72Nk597A5DrsnPvY2Tn3sDkOuyc+9jZOfewOQ67Jz4/DZOfH4DkOuyc+Pw2Tn3sDksvy6bJz72Nk597A//Z',
  height: 320,
  width: 240,
};

// On veut retrouver la version encodée. Début :
const dg2fileEncodedStart = [
  117, -126, 53, -14, 127, 97, -126, 53, -19, 2, 1, 1, 127, 96, -126, 53, -27,
  -95, 15, -128, 2, 1, 1, -127, 1, 2, -121, 2, 1, 1, -120, 2, 0, 8, 95, 46,
  -126, 53, -49, 70, 65, 67, 0, 48, 49, 48, 0, 0, 0, 53, -49, 0, 1, 0, 0, 53,
  -63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 0, -16, 1, 64, 1,
  1, 0, 0, 0, 0, 0, 0, 0, 12, 10,
];

const photoBytes = atob(photo.base64.split(',')[1])
  .split('')
  .map(char => char.charCodeAt(0));

console.log('photoBytes:', photoBytes);
