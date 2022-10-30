import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Linking,
  Alert,
} from "react-native";

// External Libraries
import moment from "moment";
import "moment/locale/en-gb";

// Vector Icons
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { Zocial } from "@expo/vector-icons";
import { EvilIcons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Custom Components & Functions
import api from "../api/client";
import { COLORS } from "../variables/color";
import { decodeString, getPrice } from "../helper/helper";
import { useStateValue } from "../StateProvider";
import AppButton from "../components/AppButton";
import AppTextButton from "../components/AppTextButton";
import { paginationData } from "../app/pagination/paginationData";
import { getRelativeTimeConfig, getWeek, __ } from "../language/stringPicker";
import { routes } from "../navigation/routes";
import CallIcon from "../components/svgComponents/CallIcon";
import MessageIcon from "../components/svgComponents/MessageIcon";
import GlobeIcon from "../components/svgComponents/GlobeIcon";
import ReadMore from "react-native-read-more-text";

const storeDetailsTexts = {
  membershipMomentFormate: "D MMM, YYYY",
};

const { width: windowWidth } = Dimensions.get("window");

const storeDetailfallbackImage = {
  listingCardImage: require("../assets/100x100.png"),
  logo: require("../assets/100x100.png"),
  banner: require("../assets/200X150.png"),
};

const weekData = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};
const week = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const StoreDetailsScreen = ({ route, navigation }) => {
  const [{ config, user, ios, appSettings, rtl_support }] = useStateValue();
  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState();
  const [storeExpired, setStoreExpired] = useState(false);
  const [storeId, setStoreId] = useState(route.params.storeId);

  const [initial, setInitial] = useState(true);
  const [storeListingSData, setStoreListingsData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [weekDays, setWeekDays] = useState(getWeek(appSettings.lng) || {});

  const [currentPage, setCurrentPage] = useState(
    pagination.page || paginationData.storeDetails.page
  );
  // {* Get Store Detail Call *}
  useEffect(() => {
    const timeConfig = getRelativeTimeConfig(appSettings.lng);
    moment.updateLocale("en-gb", {
      relativeTime: timeConfig,
    });
    if (storeData) return;
    getStoreDetail(route.params.storeId);
  }, []);

  // {* Get Store Listings Call *}
  useEffect(() => {
    if (!initial && loading) return;
    getStoreListings(storeId, paginationData.storeDetails);
  }, [loading]);

  // {* Refreshing get listing call *}
  useEffect(() => {
    if (!refreshing) return;
    setCurrentPage(1);
    setPagination({});
    getStoreListings(storeId, paginationData.storeDetails);
  }, [refreshing]);

  // {* Next page get listing call *}
  useEffect(() => {
    if (!moreLoading) return;
    const tempPaginationData = {
      per_page: paginationData.storeDetails.per_page,
      page: currentPage,
    };
    getStoreListings(storeId, tempPaginationData);
  }, [moreLoading]);

  const getStoreDetail = (storeId) => {
    api.get(`stores/${storeId}`).then((res) => {
      console.log(res.data);
      if (res.ok) {
        if (res.data) {
          setStoreData(res.data);
          setLoading(false);
        } else {
          setStoreExpired(true);
          setLoading(false);
        }
      } else {
        // print error
        // TODO handle error
        setLoading(false);
      }
    });
  };

  const getStoreListings = (storeId, paginationData) => {
    const args = { ...paginationData, store_id: storeId };
    api.get("store/listings", { ...args }).then((res) => {
      if (res.ok) {
        if (refreshing) {
          setRefreshing(false);
        }
        if (moreLoading) {
          setStoreListingsData((prevStoreListingsData) => [
            ...prevStoreListingsData,
            ...res.data.data,
          ]);
          setCurrentPage(res.data.pagination.page);
          setMoreLoading(false);
        } else {
          setStoreListingsData(res.data.data);
        }
        setPagination(res.data.pagination ? res.data.pagination : {});

        if (initial) {
          setInitial(false);
        }
        if (loading) {
          setLoading(false);
        }
      } else {
        // print error
        // TODO handle error
        // if error give retry button and set initial to true only for initial call
        if (refreshing) {
          setRefreshing(false);
        }
        if (moreLoading) {
          setMoreLoading(false);
        }
        if (loading) {
          setLoading(false);
        }
        if (initial) {
          setInitial(false);
        }
      }
    });
  };

  const handleEmail = () => {
    if (user === null && config?.registered_only?.store_contact) {
      handleEmailLoginAlert();
    } else {
      const data = {
        id: storeData.id,
        title: storeData.title,
      };
      navigation.navigate(routes.sendEmailScreen, {
        store: data,
        source: "store",
      });
    }
  };

  const handleEmailLoginAlert = () => {
    Alert.alert(
      "",
      __("storeDetailsTexts.loginAlert", appSettings.lng),
      [
        {
          text: __("storeDetailsTexts.cancelButtonTitle", appSettings.lng),
        },
        {
          text: __("storeDetailsTexts.loginButtonTitle", appSettings.lng),
          onPress: () => navigation.navigate(routes.loginScreen),
        },
      ],
      { cancelable: false }
    );
  };

  const renderListItem = useCallback(
    ({ item }) => <StoreListingCard item={item} />,
    []
  );
  const StoreListingCard = ({ item }) => (
    <View
      style={{
        backgroundColor: COLORS.white,
        padding: "3%",
        marginHorizontal: "3%",
        borderRadius: 5,
        elevation: 1,
        shadowColor: COLORS.border_light,
        shadowOpacity: 0.2,
        shadowRadius: 2,
        shadowOffset: {
          height: 2,
          width: 2,
        },
      }}
    >
      <TouchableOpacity
        style={[styles.storeListingCardContent, rtlView]}
        onPress={() => handleViewListing(item)}
      >
        <View style={styles.listingCardImageWrap}>
          <Image
            source={
              !!item.images.length
                ? { uri: item.images[0].sizes.thumbnail.src }
                : storeDetailfallbackImage.listingCardImage
            }
            style={styles.listingCardImage}
          />
        </View>
        <View
          style={[
            styles.listingCardDetailWrap,
            {
              paddingLeft: rtl_support ? 0 : 10,
              paddingRight: rtl_support ? 10 : 0,
            },
          ]}
        >
          <View style={styles.listingCardDetailContent}>
            <View
              style={[
                styles.listingCardDetailLeft,
                { alignItems: rtl_support ? "flex-end" : "flex-start" },
              ]}
            >
              <View
                style={{ alignItems: rtl_support ? "flex-end" : "flex-start" }}
              >
                <Text
                  style={[styles.listingCardTitle, rtlText]}
                  numberOfLines={1}
                >
                  {decodeString(item.title)}
                </Text>
                <View
                  style={[
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      marginVertical: ios ? 3 : 2,
                    },
                    rtlView,
                  ]}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        paddingRight: rtl_support ? 0 : 5,
                        paddingLeft: rtl_support ? 5 : 0,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="clock"
                      size={12}
                      color={COLORS.text_gray}
                    />
                  </View>
                  <Text style={[styles.listingCardText, rtlText]}>
                    {moment(item.created_at).fromNow()}
                  </Text>
                </View>
                <View
                  style={[
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      marginVertical: ios ? 3 : 2,
                    },
                    rtlView,
                  ]}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        paddingRight: rtl_support ? 0 : 5,
                        paddingLeft: rtl_support ? 5 : 0,
                      },
                    ]}
                  >
                    <FontAwesome5
                      name="eye"
                      size={12}
                      color={COLORS.text_gray}
                    />
                  </View>
                  <Text style={[styles.listingCardText, rtlText]}>
                    {__("storeDetailsTexts.viewsCount", appSettings.lng)}{" "}
                    {item?.view_count}
                  </Text>
                </View>
              </View>
              <Text
                style={[styles.listingCardPrice, rtlText]}
                numberOfLines={1}
              >
                {getPrice(
                  config.currency,
                  {
                    pricing_type: item.pricing_type,
                    price_type: item.price_type,
                    price: item.price,
                    max_price: item.max_price,
                  },
                  appSettings.lng
                )}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  const handleViewListing = (listing) => {
    navigation.push(routes.listingDetailScreen, {
      listingId: listing.listing_id,
    });
  };

  const ListSeparator = () => (
    <View
      style={{
        height: 1,
        width: "94%",
        backgroundColor: COLORS.bg_dark,
        marginVertical: 5,
        marginHorizontal: "3%",
      }}
    ></View>
  );

  const getOpenHours = () => {
    if (storeData) {
      if (storeData?.opening_hours?.type === "always") {
        return __("storeDetailsTexts.alwaysOpen", appSettings.lng);
      }
      if (storeData?.opening_hours?.type === "selected") {
        const today = weekData[new Date().getDay()];

        if (storeData?.opening_hours?.hours[today]?.active) {
          if (
            storeData?.opening_hours?.hours[today]?.open ||
            storeData?.opening_hours?.hours[today]?.close
          ) {
            return __("storeDetailsTexts.openingHourOpen", appSettings.lng);
          } else {
            return __("storeDetailsTexts.fullDayOpen", appSettings.lng);
          }
        } else {
          return __("storeDetailsTexts.closed", appSettings.lng);
        }
      }
    }
    return null;
  };

  const keyExtractor = useCallback((item, index) => `${index}`, []);

  const handleMoreDetailPress = () => {
    navigation.navigate(routes.storeMoreDetailsScreen, { data: storeData });
  };

  const handleLoginAlert = () => {
    Alert.alert(
      "",
      __("listingDetailScreenTexts.loginAlert", appSettings.lng),
      [
        {
          text: __(
            "listingDetailScreenTexts.cancelButtonTitle",
            appSettings.lng
          ),
        },
        {
          text: __(
            "listingDetailScreenTexts.loginButtonTitle",
            appSettings.lng
          ),
          onPress: () => navigation.navigate(routes.loginScreen),
        },
      ],
      { cancelable: false }
    );
  };

  const habdleSocialLinkOpen = (url) => {
    Linking.openURL(url);
  };

  const renderTruncatedFooter = (handleDescriptionToggle) => {
    return (
      <Text
        style={{
          color: COLORS.text_gray,
          marginTop: 10,
          fontWeight: "bold",
          textAlign: "center",
        }}
        onPress={handleDescriptionToggle}
      >
        {__("listingDetailScreenTexts.showMore", appSettings.lng)}
      </Text>
    );
  };
  const renderRevealedFooter = (handleDescriptionToggle) => {
    return (
      <Text
        style={{
          color: COLORS.text_gray,
          marginTop: 10,
          fontWeight: "bold",
          textAlign: "center",
        }}
        onPress={handleDescriptionToggle}
      >
        {__("listingDetailScreenTexts.showLess", appSettings.lng)}
      </Text>
    );
  };

  const getOpeningHours = () => {
    const data = storeData.opening_hours.hours;
    if (storeData.opening_hours.type === "selected") {
      return week.map((item, index) => (
        <OpeningDay
          item={item}
          key={index}
          data={data}
          today={week[new Date().getDay()] === item}
          index={index}
        />
      ));
    } else {
      return (
        <View
          style={{ width: "100%", alignItems: "center", paddingVertical: 5 }}
        >
          <Text
            style={[{ fontWeight: "bold", color: COLORS.text_dark }, rtlTextA]}
          >
            {__("storeMoreDetailTexts.alwaysOpen", appSettings.lng)}
          </Text>
        </View>
      );
    }
  };

  const OpeningDay = ({ item, data, today, index }) => (
    <View style={[styles.dayWrap, rtlView]}>
      <View
        style={[
          styles.dayContentWrap,
          {
            paddingLeft: rtl_support ? 0 : 18,
            paddingRight: rtl_support ? 18 : 0,
            alignItems: rtl_support ? "flex-end" : "flex-start",
          },
        ]}
      >
        <Text
          style={[
            styles.dayTitle,
            {
              fontWeight: today ? "bold" : "normal",
              color: today ? COLORS.text_dark : COLORS.text_gray,
            },
            rtlText,
          ]}
          numberOfLines={1}
        >
          {weekDays[index]}
        </Text>
      </View>
      <View style={styles.dayContentWrap}>
        {data[item]?.active ? (
          <>
            {!!data[item]?.open && !!data[item]?.close ? (
              <>
                {rtl_support ? (
                  <Text
                    style={[
                      styles.hoursText,
                      {
                        fontWeight: today ? "bold" : "normal",
                        color: today ? COLORS.text_dark : COLORS.text_gray,
                      },
                      rtlTextA,
                    ]}
                  >
                    {data[item].close}
                    {" - "}
                    {data[item].open}
                  </Text>
                ) : (
                  <Text
                    style={[
                      styles.hoursText,
                      {
                        fontWeight: today ? "bold" : "normal",
                        color: today ? COLORS.text_dark : COLORS.text_gray,
                      },
                    ]}
                  >
                    {data[item].open}
                    {" - "}
                    {data[item].close}
                  </Text>
                )}
              </>
            ) : (
              <Text
                style={[
                  styles.hoursText,
                  {
                    fontWeight: today ? "bold" : "normal",
                    color: today ? COLORS.text_dark : COLORS.text_gray,
                  },
                  rtlTextA,
                ]}
              >
                {__("storeMoreDetailTexts.fullDayOpen", appSettings.lng)}
              </Text>
            )}
          </>
        ) : (
          <Text
            style={[
              styles.closedText,
              {
                fontWeight: today ? "bold" : "normal",
              },
              rtlTextA,
            ]}
          >
            {__("storeMoreDetailTexts.closed", appSettings.lng)}
          </Text>
        )}
      </View>
    </View>
  );

  const ListHeader = useCallback(
    () => (
      <View style={[styles.storeTop]}>
        {/* Store Detail */}
        <View style={[styles.storeDetailWrap, { paddingBottom: 10 }]}>
          {/* Store Banner */}
          <View style={styles.bannerWrap}>
            <Image
              source={
                !!storeData.banner
                  ? { uri: storeData.banner }
                  : storeDetailfallbackImage.banner
              }
              style={styles.banner}
            />
          </View>

          <View style={{ width: "100%", height: windowWidth * 0.94 * 0.15 }}>
            <View
              style={{
                height: windowWidth * 0.94 * 0.24,
                width: windowWidth * 0.94 * 0.24,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: COLORS.white,
                borderRadius: windowWidth * 0.94 * 0.12,
                position: "absolute",
                zIndex: 2,
                top: 0,
                left: "50%",
                transform: [
                  { translateY: -windowWidth * 0.94 * 0.12 },
                  { translateX: -windowWidth * 0.94 * 0.12 },
                ],
              }}
            >
              <View style={styles.storeLogo}>
                <Image
                  style={styles.logo}
                  source={
                    storeData?.logo
                      ? { uri: storeData.logo }
                      : storeDetailfallbackImage.logo
                  }
                />
              </View>
            </View>
          </View>

          <View
            style={{
              alignItems: rtl_support ? "flex-end" : "flex-start",
            }}
          >
            <Text style={[styles.storeTitle, rtlText]} numberOfLines={1}>
              {storeData?.title
                ? decodeString(storeData.title)
                : __("storeDetailsTexts.nullText", appSettings.lng)}
            </Text>
          </View>
          {
            <View
              style={{
                flexDirection: rtl_support ? "row-reverse" : "row",
                alignItems: "center",
                paddingVertical: 5,
              }}
            >
              <MaterialIcons
                name="verified"
                size={20}
                color={config?.seller_verification?.badge_color || "green"}
              />
              <View style={{ paddingHorizontal: 5 }}>
                <Text
                  style={[
                    {
                      fontSize: 15,
                      color:
                        config?.seller_verification?.badge_color || "green",
                    },
                    rtlText,
                  ]}
                >
                  {__("listingDetailScreenTexts.verified", appSettings.lng)}
                </Text>
              </View>
            </View>
          }
          <View style={{ paddingVertical: 5 }}>
            <Text
              style={[
                styles.storeDetailMidrowText,
                {
                  fontSize: 15,
                  color: COLORS.text_dark,
                },
                rtlText,
              ]}
            >
              {__("storeDetailsTexts.membership", appSettings.lng)}
              {" : "}
              <Text style={{ color: COLORS.text_gray }}>
                {moment(storeData.created_at).format(
                  storeDetailsTexts.membershipMomentFormate
                )}
              </Text>
            </Text>
          </View>
          <View
            style={{
              height: 1,
              width: "90%",
              backgroundColor: COLORS.border_light,
              marginTop: 10,
              marginBottom: 10,
            }}
          />
          {/* Phone, Email, Website */}
          <View>
            {!!storeData?.phone && (
              <View style={[styles.storeDetailMidrow, rtlView]}>
                <View style={styles.storeDetailMidrowIconWrap}>
                  <CallIcon fillColor={COLORS.primary} />
                </View>
                <View style={[rtlView]}>
                  <Text
                    style={[
                      styles.storeDetailMidrowText,
                      {
                        marginRight: rtl_support ? 5 : 0,
                        marginLeft: rtl_support ? 0 : 5,
                      },
                      rtlText,
                    ]}
                    numberOfLines={1}
                  >
                    {!!storeData?.phone
                      ? decodeString(storeData.phone)
                      : __("storeDetailsTexts.nullText", appSettings.lng)}
                  </Text>
                </View>
              </View>
            )}
            {!!storeData?.website && (
              <View style={[styles.storeDetailMidrow, rtlView]}>
                <View style={styles.storeDetailMidrowIconWrap}>
                  <GlobeIcon fillColor={COLORS.primary} />
                </View>
                <Text
                  style={[
                    styles.storeDetailMidrowText,
                    {
                      marginRight: rtl_support ? 5 : 0,
                      marginLeft: rtl_support ? 0 : 5,
                    },
                    rtlText,
                  ]}
                >
                  {!!storeData?.website
                    ? storeData.website
                    : __("storeDetailsTexts.nullText", appSettings.lng)}
                </Text>
              </View>
            )}
          </View>
          {/* Social Section */}
          {!!storeData?.social && (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                paddingVertical: 10,
              }}
            >
              {!!storeData?.social?.facebook && (
                <TouchableOpacity
                  style={{ marginHorizontal: 5 }}
                  onPress={() =>
                    habdleSocialLinkOpen(storeData.social.facebook)
                  }
                >
                  <FontAwesome
                    name="facebook-square"
                    size={30}
                    color="#008fd9"
                  />
                </TouchableOpacity>
              )}
              {!!storeData?.social?.twitter && (
                <TouchableOpacity
                  style={{ marginHorizontal: 5 }}
                  onPress={() => habdleSocialLinkOpen(storeData.social.twitter)}
                >
                  <FontAwesome
                    name="twitter-square"
                    size={30}
                    color="#30d7f2"
                  />
                </TouchableOpacity>
              )}
              {!!storeData?.social?.youtube && (
                <TouchableOpacity
                  style={{ marginHorizontal: 5 }}
                  onPress={() => habdleSocialLinkOpen(storeData.social.youtube)}
                >
                  <FontAwesome
                    name="youtube-square"
                    size={30}
                    color="#f50000"
                  />
                </TouchableOpacity>
              )}
              {!!storeData?.social?.linkedin && (
                <TouchableOpacity
                  style={{ marginHorizontal: 5 }}
                  onPress={() =>
                    habdleSocialLinkOpen(storeData.social.linkedin)
                  }
                >
                  <FontAwesome
                    name="linkedin-square"
                    size={30}
                    color="#00a0dc"
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        {!!storeData?.description && (
          <View style={[styles.storeDetailWrap, { paddingVertical: 10 }]}>
            <View
              style={{
                paddingHorizontal: 10,
                alignItems: rtl_support ? "flex-end" : "flex-start",
                width: "100%",
                paddingBottom: 10,
                paddingTop: 5,
              }}
            >
              <Text
                style={[
                  { fontSize: 16, fontWeight: "bold", color: COLORS.text_dark },
                  rtlTextA,
                ]}
              >
                {__("listingDetailScreenTexts.description", appSettings.lng)}
              </Text>
            </View>
            <View
              style={{
                height: 1,
                width: "94%",
                marginVertical: 5,
                backgroundColor: COLORS.border_light,
              }}
            />
            <View
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 5,
                paddingHorizontal: 10,
                paddingVertical: 5,
                width: "100%",
              }}
            >
              <ReadMore
                numberOfLines={3}
                renderTruncatedFooter={renderTruncatedFooter}
                renderRevealedFooter={renderRevealedFooter}
              >
                <Text
                  style={[
                    rtlText,
                    {
                      textAlign: "justify",
                      color: COLORS.text_gray,
                      lineHeight: 25,
                    },
                  ]}
                >
                  {decodeString(storeData.description).trim()}
                </Text>
              </ReadMore>
            </View>
          </View>
        )}
        <View style={[styles.storeDetailWrap, { paddingVertical: 5 }]}>
          <View
            style={{
              flexDirection: rtl_support ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 10,
              width: "100%",
            }}
          >
            <View style={styles.view}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: COLORS.text_dark,
                }}
              >
                {__(
                  "storeMoreDetailTexts.sectionTitles.openinigDateTime",
                  appSettings.lng
                )}
              </Text>
            </View>

            <View
              style={{
                flexDirection: rtl_support ? "row-reverse" : "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  height: 0,
                  width: 0,
                  borderTopWidth: 15,
                  borderTopColor: "transparent",
                  borderBottomWidth: 15,
                  borderBottomColor: "transparent",
                  borderRightWidth: rtl_support ? 0 : 15,
                  borderRightColor: COLORS.primary,
                  borderLeftWidth: rtl_support ? 15 : 0,
                  borderLeftColor: COLORS.primary,
                }}
              />
              <View
                style={[
                  {
                    paddingLeft: rtl_support ? 10 : 0,
                    paddingRight: rtl_support ? 0 : 10,
                    height: 30,
                    justifyContent: "center",
                    backgroundColor: COLORS.primary,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "bold",
                    color: COLORS.white,
                  }}
                >
                  {getOpenHours()}
                </Text>
              </View>
            </View>
          </View>
          <View
            style={{
              width: "90%",
              backgroundColor: COLORS.border_light,
              height: 1,
              marginVertical: 5,
            }}
          />
          <View style={{ width: "100%" }}>
            {["selected", "always"].includes(storeData?.opening_hours?.type) ? (
              getOpeningHours()
            ) : (
              <View
                style={{
                  width: "100%",
                  alignItems: "center",
                  paddingVertical: 10,
                }}
              >
                <Text
                  style={[
                    { fontWeight: "bold", color: COLORS.text_dark },
                    rtlText,
                  ]}
                >
                  {__("storeMoreDetailTexts.noData", appSettings.lng)}
                </Text>
              </View>
            )}
          </View>
        </View>
        {!!storeData?.address && (
          <View style={[styles.storeDetailWrap, { paddingVertical: 10 }]}>
            <View
              style={{
                paddingHorizontal: 10,
                alignItems: rtl_support ? "flex-end" : "flex-start",
                width: "100%",
                paddingBottom: 10,
                paddingTop: 5,
              }}
            >
              <Text
                style={[
                  { fontSize: 16, fontWeight: "bold", color: COLORS.text_dark },
                  rtlTextA,
                ]}
              >
                {__(
                  "storeMoreDetailTexts.sectionTitles.storeAddress",
                  appSettings.lng
                )}
              </Text>
            </View>
            <View
              style={{
                height: 1,
                width: "94%",
                marginVertical: 5,
                backgroundColor: COLORS.border_light,
              }}
            />
            <View
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 5,
                paddingHorizontal: 10,
                paddingVertical: 5,
                width: "100%",
              }}
            >
              <Text
                style={[
                  rtlTextA,
                  {
                    textAlign: "justify",
                    color: COLORS.text_gray,
                    lineHeight: 25,
                  },
                ]}
              >
                {decodeString(storeData.address).trim()}
              </Text>
            </View>
          </View>
        )}

        {/* Flatlist Title */}
        <View
          style={[
            {
              width: "100%",
              paddingHorizontal: "3%",
              marginVertical: 10,
            },
            rtlView,
          ]}
        >
          <Text
            style={[
              {
                fontSize: 15,
                fontWeight: "bold",
                color: COLORS.text_dark,
                lineHeight: 20,
              },
              rtlText,
            ]}
          >
            {__("storeDetailsTexts.latestAds", appSettings.lng)}
          </Text>
        </View>
      </View>
    ),
    [storeData]
  );

  const EmptyListComponent = () => {
    if (initial) {
      return (
        <View style={styles.view}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    } else {
      return (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={[
              {
                fontSize: 15,
                fontWeight: "bold",
                color: COLORS.gray,
              },
              rtlText,
            ]}
          >
            {__("storeDetailsTexts.emptyListing", appSettings.lng)}
          </Text>
        </View>
      );
    }
  };

  const listFooter = () => {
    if (pagination && pagination.total_pages > pagination.current_page) {
      return (
        <View style={styles.loadMoreWrap}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      );
    } else {
      return null;
    }
  };

  const handleNextPageLoading = () => {
    if (refreshing) return;
    if (pagination && pagination.total_pages > pagination.current_page) {
      setCurrentPage((prevCurrentPage) => prevCurrentPage + 1);
      setMoreLoading(true);
    }
  };

  const handleCall = (number) => {
    setModalVisible(false);
    let phoneNumber = "";
    if (ios) {
      phoneNumber = `telprompt:${number}`;
    } else {
      phoneNumber = `tel:${number}`;
    }
    Linking.openURL(phoneNumber);
  };

  const onRefresh = () => {
    if (moreLoading) return;
    setRefreshing(true);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  const rtlTextA = rtl_support && {
    writingDirection: "rtl",
    textAlign: "right",
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };

  return loading ? (
    // {* Loading Component *}
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={[styles.text, rtlText]}>
        {__("storeDetailsTexts.loadingText", appSettings.lng)}
      </Text>
    </View>
  ) : (
    <View style={styles.container}>
      {!storeExpired && !!storeData && (
        <>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.screenTitle, rtlText]}>
              {__("storeDetailsTexts.title", appSettings.lng)}
            </Text>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          {/* Listing FlatList */}
          <View style={styles.storeBottom}>
            <FlatList
              data={storeListingSData}
              renderItem={renderListItem}
              keyExtractor={keyExtractor}
              horizontal={false}
              showsVerticalScrollIndicator={false}
              onEndReached={handleNextPageLoading}
              onEndReachedThreshold={1}
              ListFooterComponent={listFooter}
              onRefresh={onRefresh}
              refreshing={refreshing}
              ListHeaderComponent={ListHeader}
              ListEmptyComponent={EmptyListComponent}
              ItemSeparatorComponent={ListSeparator}
              contentContainerStyle={{
                paddingBottom: 70,
              }}
            />
          </View>
          {/* Call prompt */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
          >
            <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
              <View style={styles.modalOverlay} />
            </TouchableWithoutFeedback>
            {!!storeData.phone && (
              <View
                style={{
                  flex: 1,
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    paddingHorizontal: "3%",
                    padding: 20,
                    backgroundColor: COLORS.white,
                    width: "100%",
                  }}
                >
                  <Text style={[styles.callText, rtlText]}>
                    {__("storeDetailsTexts.callPrompt", appSettings.lng)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleCall(storeData.phone)}
                    style={styles.phone}
                  >
                    <Text style={[styles.phoneText, rtlText]}>
                      {storeData.phone}
                    </Text>
                    <FontAwesome5
                      name="phone"
                      size={18}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>
                  {ios && (
                    <AppTextButton
                      title={__(
                        "storeDetailsTexts.cancelButtonTitle",
                        appSettings.lng
                      )}
                      style={{ marginTop: 20 }}
                      onPress={() => setModalVisible(false)}
                    />
                  )}
                </View>
              </View>
            )}
          </Modal>
        </>
      )}
      {storeExpired && (
        <View style={styles.expiredWrap}>
          <EvilIcons name="exclamation" size={50} color={COLORS.red} />
          <Text style={[styles.expiredText, rtlText]}>
            {__("storeDetailsTexts.storeExpired", appSettings.lng)}
          </Text>
          <AppButton
            title={__("storeDetailsTexts.goBackButtonTitle", appSettings.lng)}
            onPress={handleGoBack}
            style={styles.goBackButton}
          />
        </View>
      )}
      {(user === null || user?.id !== storeData?.owner_id) &&
        !config?.disabled?.listing_contact &&
        (!!storeData?.phone || !!storeData?.email) && (
          <View
            style={{
              paddingVertical: 10,
              position: "absolute",
              bottom: 0,
              width: "100%",
              paddingHorizontal: "1.5%",
            }}
          >
            <View
              style={[
                styles.storeContactWrap,
                {
                  justifyContent: "center",
                },
              ]}
            >
              {!!storeData?.phone && (
                <TouchableOpacity
                  style={[
                    styles.storeContactButton,
                    { backgroundColor: COLORS.primary },
                  ]}
                  onPress={() => {
                    if (
                      user === null &&
                      config?.registered_only?.store_contact
                    ) {
                      handleLoginAlert();
                    } else {
                      setModalVisible(true);
                    }
                  }}
                >
                  <Ionicons name="call" size={18} color={COLORS.white} />
                  <Text
                    style={[
                      styles.storeContactButtonText,
                      { color: COLORS.white },
                    ]}
                    numberOfLines={1}
                  >
                    {__("sellerContactTexts.call", appSettings.lng)}
                  </Text>
                </TouchableOpacity>
              )}
              {!!storeData?.email && (
                <TouchableOpacity
                  style={[
                    styles.storeContactButton,
                    { backgroundColor: COLORS.primary },
                  ]}
                  onPress={handleEmail}
                >
                  <Zocial name="email" size={18} color={COLORS.white} />
                  <Text
                    style={[
                      styles.storeContactButtonText,
                      { color: COLORS.white },
                    ]}
                    numberOfLines={1}
                  >
                    {__("sellerContactTexts.email", appSettings.lng)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
    </View>
  );
};


export default StoreDetailsScreen;
