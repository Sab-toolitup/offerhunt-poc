import { useEffect, useRef, useState } from "react";
import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
  useNavigate,
} from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  Card,
  Bleed,
  Button,
  ChoiceList,
  Divider,
  EmptyState,
  InlineStack,
  InlineError,
  Layout,
  Page,
  Text,
  TextField,
  Thumbnail,
  BlockStack,
  PageActions,
  Icon,
  Popover,
  Box,
  DatePicker,
} from "@shopify/polaris";
import { CalendarIcon, ImageIcon } from "@shopify/polaris-icons";

import db from "../db.server";
import { getDiscount, validateDiscount } from "../models/Disocunts.server";
import { BOGODiscountType } from "~/types/discounts";

export async function loader({ request, params } : LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);

  console.log(params.id)

  if (params.id === "new") {
    return json({
      destination: "product",
      title: "",
    });
  }

  return json(await getDiscount(Number(params.id), admin.graphql));
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  /** @type {any} */
  const data: any = {
    ...Object.fromEntries(await request.formData()),
    shop,
  };

  if (data.action === "delete") {
    await db.bogo.delete({ where: { id: Number(params.id) } });
    return redirect("/app");
  }

  const errors = validateDiscount(data);

  if (errors) {
    return json({ errors }, { status: 422 });
  }

  const discount =
    params.id === "new"
      ? await db.bogo.create({ data })
      : await db.bogo.update({ where: { id: Number(params.id) }, data });

  return redirect(`/app/bogo/${discount.id}`);
}

export default function DiscountForm() {
  //@ts-ignore
  const errors = useActionData()?.errors || {};

  const discount = useLoaderData<any>();
  const [formState, setFormState] = useState<BOGODiscountType>(discount);
  const [cleanFormState, setCleanFormState] = useState(discount);
  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);
  const [startDateVisible, setStartDateVisible] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(new Date());
  const [{ startMonth, startYear }, setStartDate] = useState({
    startMonth: selectedStartDate.getMonth(),
    startYear: selectedStartDate.getFullYear(),
  });

  const [endDateVisible, setEndDateVisible] = useState(false);
  const [selectedEndDate, setSelectedEndDate] = useState(new Date());
  const [{ endMonth, endYear }, setEndDate] = useState({
    endMonth: selectedStartDate.getMonth(),
    endYear: selectedStartDate.getFullYear(),
  });

  const datePickerRef = useRef(null);

  const nav = useNavigation();
  const isSaving =
    nav.state === "submitting" && nav.formData?.get("action") !== "delete";
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") === "delete";

  const navigate = useNavigate();

  async function selectProduct() {
    const products = await window.shopify.resourcePicker({
      type: "product",
      action: "select", // customized action verb, either 'select' or 'add',
    });

    if (products) {
      const { images, id, variants, title, handle } = products[0];

      setFormState({
        ...formState,
        productId: id,
        productVariantId: variants[0].id,
        productTitle: title,
        productHandle: handle,
        productAlt: images[0]?.altText,
        productImage: images[0]?.originalSrc,
      });
    }
  }

  async function selectGOProduct() {
    const products = await window.shopify.resourcePicker({
      type: "product",
      action: "select", // customized action verb, either 'select' or 'add',
    });

    if (products) {
      const { images, id, variants, title, handle } = products[0];

      setFormState({
        ...formState,
        goProductId: id,
        goProductVariantId: variants[0].id,
        goProductTitle: title,
        goProductHandle: handle,
        goProductAlt: images[0]?.altText,
        goProductImage: images[0]?.originalSrc,
      });
    }
  }

  const submit = useSubmit();
  function handleSave() {
    const data = {
      title: formState.title,
      productId: formState.productId || "",
      productVariantId: formState.productVariantId || "",
      productHandle: formState.productHandle || "",
      goProductId: formState.goProductId || "",
      goProductVariantId:  formState.goProductVariantId || "",
      goProductHandle: formState.goProductHandle || "",
      startDate: new Date().toISOString() || "",
    };

    setCleanFormState({ ...formState });
    submit(data, { method: "post" });
  }

  // function handleMonthChange(month : number, year: number, setDate: Function) {
  //   setDate({ month, year });
  // }
  // function handleDateSelection(setSelectedDate: Function, setVisible: Function, newSelectedDate: Date) {
  //   setSelectedDate(newSelectedDate);
  //   setVisible(false);
  // }

  // useEffect(() => {
  //   if (selectedStartDate) {
  //     setStartDate({
  //       startMonth: selectedStartDate.getMonth(),
  //       startYear: selectedStartDate.getFullYear(),
  //     });
  //   }
  // }, [selectedStartDate]);

  // useEffect(() => {
  //   if (selectedEndDate) {
  //     setEndDate({
  //       endMonth: selectedEndDate.getMonth(),
  //       endYear: selectedEndDate.getFullYear(),
  //     });
  //   }
  // }, [selectedEndDate]);

  return (
    <Page>
      <ui-title-bar title={discount.id ? "Edit BOGO Discount" : "Create new BOGO Discount"}>
        <button variant="breadcrumb" onClick={() => navigate("/app")}>
          BOGO Discount
        </button>
      </ui-title-bar>
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="500">
                <Text as={"h2"} variant="headingLg">
                  Title
                </Text>
                <TextField
                  id="title"
                  helpText="Customers will see this as the discount name"
                  label="title"
                  labelHidden
                  autoComplete="off"
                  value={formState.title}
                  onChange={(title) => setFormState({ ...formState, title })}
                  error={errors.title}
                />
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="500">
                <InlineStack align="space-between">
                  <Text as={"h2"} variant="headingLg">
                    Product
                  </Text>
                </InlineStack>
                <Text as={"h5"} variant="headingMd">
                  Customer Buys
                </Text>
                {formState.productId ? (
                  <InlineStack blockAlign="center" gap="500">
                    <Thumbnail
                      source={formState.productImage || ImageIcon}
                      alt={formState?.productAlt? formState.productAlt : ""}
                    />
                    <Text as="span" variant="headingMd" fontWeight="semibold">
                      {formState.productTitle}
                    </Text>
                    {formState.productId ? (
                    <Button variant="plain" onClick={selectProduct}>
                      Change product
                    </Button>
                  ) : null}
                  </InlineStack>
                ) : (
                  <BlockStack gap="200">
                    <Button onClick={selectProduct} id="select-product">
                      Select product
                    </Button>
                    {errors.productId ? (
                      <InlineError
                        message={errors.productId}
                        fieldID="myFieldID"
                      />
                    ) : null}
                  </BlockStack>
                )}
                <Text as={"h5"} variant="headingMd">
                  Customer Gets
                </Text>
                {formState.goProductId ? (
                  <InlineStack blockAlign="center" gap="500">
                    <Thumbnail
                      source={formState.goProductImage || ImageIcon}
                      alt={formState.goProductAlt ? formState.goProductAlt : ""}
                    />
                    <Text as="span" variant="headingMd" fontWeight="semibold">
                      {formState.goProductTitle}
                    </Text>
                    {formState.goProductId ? (
                    <Button variant="plain" onClick={selectGOProduct}>
                      Change product
                    </Button>
                  ) : null}
                  </InlineStack>
                ) : (
                  <BlockStack gap="200">
                    <Button onClick={selectGOProduct} id="select-product">
                      Select product
                    </Button>
                    {errors.goProductId ? (
                      <InlineError
                        message={errors.goProductId}
                        fieldID="myFieldID"
                      />
                    ) : null}
                  </BlockStack>
                )}
                <Bleed marginInlineStart="200" marginInlineEnd="200">
                  <Divider />
                </Bleed>
                <InlineStack gap="500" align="space-between" blockAlign="start">
                  <ChoiceList
                    title="Scan destination"
                    choices={[
                      { label: "Link to product page", value: "product" },
                      {
                        label: "Link to checkout page with product in the cart",
                        value: "cart",
                      },
                    ]}
                    selected={[formState.destination]}
                    onChange={(destination) =>
                      setFormState({
                        ...formState,
                        destination: destination[0],
                      })
                    }
                    error={errors.destination}
                  />
                  {/* {discount.destinationUrl ? (
                    <Button
                      variant="plain"
                      url={discount.destinationUrl}
                      target="_blank"
                    >
                      Go to destination URL
                    </Button>
                  ) : null} */}
                </InlineStack>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="500">
                <Text as={"h2"} variant="headingLg">
                  Countdown Timer
                </Text>
                <Text as={"h6"} variant="headingXs">
                  If you want to set the count for 1 hr, set the hour as 1.
                </Text>
                <TextField
                  id="countdownTimer"
                  helpText="You have added a countdown for 1 hour"
                  label="Countdown Timer"
                  labelHidden
                  autoComplete="off"
                  value={formState.countdowntime}
                  onChange={(countdowntime) => setFormState({ ...formState, countdowntime })}
                  error={errors.countdowntime}
                />
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="500">
                <Text as={"h2"} variant="headingLg">
                  Combinations
                </Text>
                <ChoiceList
                    title="Scan destination"
                    choices={[
                      { label: "Product Discounts", value: "product" },
                      {
                        label: "Shipping Discounts", value: "shpping",
                      },
                      {
                        label: "Order Discounts", value: "order",
                      }
                    ]}
                    selected={[formState.combinationType]}
                    onChange={(combinationType) =>
                      setFormState({
                        ...formState,
                        combinationType: combinationType[0],
                      })
                    }
                    error={errors.combinationType}
                  />
                  <Text as={"h6"} variant="headingXs">
                    Note: To make this work, Make sure to enable discount combinations 
                    on all your active discounts across the store. 
                  </Text>
              </BlockStack>
            </Card>
            {/* <Card>
              <BlockStack>
                <Text as="h2" variant="headingLg">
                  Schedule
                </Text>
                <Box minWidth="276px">
                  <Popover
                    active={startDateVisible}
                    autofocusTarget="none"
                    preferredAlignment="left"
                    fullWidth
                    preferInputActivator={false}
                    preferredPosition="below"
                    preventCloseOnChildOverlayClick
                    onClose={() => { setStartDateVisible(false) }}
                    activator={
                      <TextField
                        role="combobox"
                        label={"Start date"}
                        prefix={<Icon source={CalendarIcon} />}
                        value={formState.startDate}
                        onFocus={() => setStartDateVisible(true)}
                        onChange={(startDate) =>
                          setFormState({
                            ...formState,
                            startDate: startDate[0],
                          })}
                        autoComplete="off"
                      />
                    }
                  >
                    <Card>
                      <DatePicker
                        month={startMonth}
                        year={startYear}
                        selected={selectedStartDate}
                        onMonthChange={(month, year) => { handleMonthChange(month, year, setStartDate) }}
                        onChange={({ end: newSelectedDate }) => { handleDateSelection(setSelectedStartDate, setStartDateVisible, newSelectedDate) }}
                      />
                    </Card>
                  </Popover>
                </Box>
              </BlockStack>
            </Card> */}
          </BlockStack>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Card>
            <Text as={"h2"} variant="headingLg">
              BOGO Discount
            </Text>
            {discount ? (
              <EmptyState image={""} imageContained={true} />
            ) : (
              <EmptyState image="">
                Your Discount will appear here after you save
              </EmptyState>
            )}
            <BlockStack gap="300">
              {/* <Button
                disabled={!discount?.image}
                url={discount?.image}
                download
                variant="primary"
              >
                Download
              </Button> */}
              <Button
                disabled={!discount.id}
                url={`/bogos/${discount.id}`}
                target="_blank"
              >
                Go to public URL
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <PageActions
            secondaryActions={[
              {
                content: "Delete",
                loading: isDeleting,
                disabled: !discount.id || !discount || isSaving || isDeleting,
                destructive: true,
                outline: true,
                onAction: () =>
                  submit({ action: "delete" }, { method: "post" }),
              },
            ]}
            primaryAction={{
              content: "Save",
              loading: isSaving,
              disabled: !isDirty || isSaving || isDeleting,
              onAction: handleSave,
            }}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
