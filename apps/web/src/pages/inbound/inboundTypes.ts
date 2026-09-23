// Domain contract for inbound received LPN items
export interface InboundItem {
  lpnCode: string;
  skuCode: string;
  quantityNumber: number;
  locationCode: string;
  receivedAt: string;
}
