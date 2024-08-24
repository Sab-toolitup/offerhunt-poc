import { ActionFunctionArgs, json,  } from "@remix-run/node";
import { useLoaderData, Link, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  Card,
  EmptyState,
  Layout,
  Page,
  IndexTable,
  Thumbnail,
  Text,
  Icon,
  InlineStack,
} from "@shopify/polaris";

import { getDiscounts } from "../models/Disocunts.server";
import { AlertDiamondIcon, ImageIcon } from "@shopify/polaris-icons";
import { BOGODiscountType } from "~/types/discounts";

export async function loader({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const discounts = await getDiscounts(session.shop, admin.graphql);

  return json({
    discounts,
  });
}

//TODO: replace the any with types
const EmptyDiscountsState = ({ onAction }: any) => (
  <EmptyState
    heading="Create BOGO Discounts for your product"
    action={{
      content: "Create BOGO Discount",
      onAction,
    }}
    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  >
    <p>Allow customers to Create BOGO Discounts.</p>
  </EmptyState>
);

function truncate(str : string, { length = 25 } = {}) {
  if (!str) return "";
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

const BOGOTable = ({ discounts }: {discounts : BOGODiscountType[]}) => (
  <IndexTable
    resourceName={{
      singular: "Discount",
      plural: "Discounts",
    }}
    itemCount={discounts.length}
    headings={[
      { title: "Thumbnail", hidden: true },
      { title: "Title" },
      { title: "Product" },
      { title: "Date created" },
    ]}
    selectable={false}
  >
    {discounts.map((discount) => (
      <BOGOTableRow key={discount.id} discount={discount} />
    ))}
  </IndexTable>
);

const BOGOTableRow = ({ discount }: {discount : BOGODiscountType}) => (
  <IndexTable.Row id={discount.id.toString()} position={discount.id}>
    <IndexTable.Cell>
      <Thumbnail
        source={discount.productImage || ImageIcon}
        alt={discount.productTitle}
        size="small"
      />
    </IndexTable.Cell>
    <IndexTable.Cell>
      <Link to={`/app/bogos/${discount.id}`}>{truncate(discount.title)}</Link>
    </IndexTable.Cell>
    <IndexTable.Cell>
      {discount.productDeleted ? (
        <InlineStack align="start" gap="200">
          <span style={{ width: "20px" }}>
            <Icon source={AlertDiamondIcon} tone="critical" />
          </span>
          <Text tone="critical" as="span">
            product has been deleted
          </Text>
        </InlineStack>
      ) : (
        truncate(discount.productTitle)
      )}
    </IndexTable.Cell>
    <IndexTable.Cell>
      {new Date(discount.createdAt).toDateString()}
    </IndexTable.Cell>
  </IndexTable.Row>
);

export default function Index() {
  const { discounts }: any = useLoaderData();
  const navigate = useNavigate();

  return (
    <Page>
      <ui-title-bar title="BOGO Discounts">
        <button variant="primary" onClick={() => navigate("/app/bogos/new")}>
          Create BOGO
        </button>
      </ui-title-bar>
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {discounts.length === 0 ? (
              <EmptyDiscountsState onAction={() => navigate("bogos/new")} />
            ) : (
              <BOGOTable discounts={discounts} />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}