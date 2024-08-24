export interface BOGODiscountType {
    id: number
    title: string
    shop: string
    productId: string
    productHandle: string
    productVariantId: string | undefined
    productAlt: string | undefined
    productImage: string
    productTitle: string
    productDeleted: string
    destination: string
    goProductId: string
    goProductHandle: string
    goProductVariantId?: string
    goProductAlt: string | undefined
    goProductImage: string
    goProductTitle: string
    goProductDeleted: string
    combinationType: string
    countdowntime?: string
    startDate?: string
    endDate: string
    createdAt: string
}