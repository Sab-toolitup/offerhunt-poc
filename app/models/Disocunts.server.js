import invariant from "tiny-invariant";
import db from "../db.server";
import { ButtonGroup } from "@shopify/polaris";

export async function getDiscount(id, graphql) {
  const bogo = await db.bogo.findFirst({ where: { id } });

  if (!ButtonGroup) {
    return null;
  }
  console.log(bogo)

  return supplementDiscount(bogo, graphql);
}

export async function getDiscounts(shop, graphql) {
  const discounts = await db.bogo.findMany({
    where: { shop },
    orderBy: { id: "desc" },
  });

  if (discounts.length === 0) return [];

  return Promise.all(
    discounts.map((discount) => supplementDiscount(discount, graphql))
  );
}

// export function getQRCodeImage(id) {
//   const url = new URL(`/qrcodes/${id}/scan`, process.env.SHOPIFY_APP_URL);
//   return qrcode.toDataURL(url.href);
// }

export function getDestinationUrl(discount) {
  if (discount.destination === "product") {
    return `https://${discount.shop}/products/${discount.productHandle}`;
  }

  const match = /gid:\/\/shopify\/ProductVariant\/([0-9]+)/.exec(discount.productVariantId);
  invariant(match, "Unrecognized product variant ID");

  return `https://${discount.shop}/cart/${match[1]}:1`;
}

async function supplementDiscount(discount, graphql) {
  // const qrCodeImagePromise = getQRCodeImage(qrCode.id);

  const response = await graphql(
    `
      query bogoDiscount($id: ID!) {
        product(id: $id) {
          title
          images(first: 1) {
            nodes {
              altText
              url
            }
          }
        }
      }
    `,
    {
      variables: {
        id: discount.productId,
      },
    }
  );

  const {
    data: { product },
  } = await response.json();

  const responseGo = await graphql(
    `
      query bogoDiscount($id: ID!) {
        product(id: $id) {
          title
          images(first: 1) {
            nodes {
              altText
              url
            }
          }
        }
      }
    `,
    {
      variables: {
        id: discount.goProductId,
      },
    }
  );

  const {
    data: { productGo },
  } = await responseGo.json();

  return {
    ...discount,
    productDeleted: !product?.title,
    productTitle: product?.title,
    productImage: product?.images?.nodes[0]?.url,
    productAlt: product?.images?.nodes[0]?.altText,
    goProductDeleted: !productGo?.title,
    goProductTitle: productGo?.title,
    goProductImage: productGo?.images?.nodes[0]?.url,
    goProductAlt: productGo?.images?.nodes[0]?.altText,
  };
}

export function validateDiscount(data) {
  const errors = {};

  if (!data.title) {
    errors.title = "Title is required";
  }

  if (!data.productId) {
    errors.productId = "Product is required";
  }

  if (Object.keys(errors).length) {
    return errors;
  }
}