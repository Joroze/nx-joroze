import { GetStaticPropsContext } from 'next';
import { fetchFromContentful } from '../../..';
import {
  Heading,
  Text,
  VStack,
  Button,
  Box,
  chakra,
  Stack,
  StackDivider,
  HStack,
} from '@chakra-ui/react';
import { CouponEntity, CouponEntry } from '@joroze/cms';
import NextLink from 'next/link';
import { Card } from '@joroze/ui';
import { getLayout } from '../../../../layouts/BrandLayout';

type Props = {
  coupon: CouponEntry;
  brand: CouponEntity;
};

export default function CouponPage({ coupon, brand }: Props) {
  return (
    <VStack spacing="7" width="full">
      <Box width="full">
        <Heading
          size="lg"
          fontWeight="extrabold"
          textAlign={{ base: 'center', lg: 'left' }}
        >
          Promotion {brand.name} - {coupon.title}
        </Heading>
      </Box>

      <Card width="full" alignItems="start">
        <Stack
          direction={{ base: 'column', xl: 'row' }}
          spacing={4}
          width="full"
          align="center"
        >
          <Stack
            width="full"
            spacing={6}
            align={{ base: 'center', xl: 'start' }}
          >
            <Text cursor="pointer" fontWeight="extrabold">
              Information
            </Text>
            <HStack
              width="full"
              divider={<StackDivider borderColor="gray.200" />}
              textAlign="left"
              spacing={{ base: 0, xl: '6' }}
            >
              <VStack width={{ base: '33%', xl: 'initial' }}>
                <Text fontSize="sm" color="gray.600">
                  Coupons received
                </Text>
                <Text fontSize="xs">...</Text>
              </VStack>
              <VStack width={{ base: '33%', xl: 'initial' }}>
                <Text fontSize="sm" color="gray.600">
                  Coupon validity
                </Text>
                <Text fontSize="xs">{coupon.expiresAt || 'endless'}</Text>
              </VStack>
              <VStack width={{ base: '33%', xl: 'initial' }}>
                <Text fontSize="sm" color="gray.600">
                  Rating
                </Text>
                <Text fontSize="xs">...</Text>
              </VStack>
            </HStack>
          </Stack>
          <NextLink href={`/api/partner-redirect/${coupon.sys.id}`} passHref>
            <chakra.a target="_blank" rel="noopener noreferrer">
              <Button rounded="full" colorScheme={'purple'}>
                Open a share
              </Button>
            </chakra.a>
          </NextLink>
        </Stack>
      </Card>

      <Card width="full" alignItems="flex-start">
        <Text cursor="pointer" fontWeight="extrabold">
          Coupon description
        </Text>
        <Text>{coupon.description}</Text>
      </Card>
    </VStack>
  );
}

CouponPage.defaultProps = {
  meta: {
    title: '',
    description: '',
    imgSrc: '',
  },
};

CouponPage.getLayout = getLayout;

export const getStaticProps = async ({
  params,
  preview = false,
}: GetStaticPropsContext) => {
  const couponSlug = Array.isArray(params?.couponSlug)
    ? params?.couponSlug[0]
    : params?.couponSlug;

  const [{ couponEntryCollection }, { couponEntityCollection }] =
    await Promise.all([
      fetchFromContentful().Coupons({
        slug: couponSlug,
      }),
      fetchFromContentful().Brands(),
    ]);

  const coupon = couponEntryCollection?.items[0];
  const brands = couponEntityCollection?.items;
  const brand = brands?.find(
    (brand) => brand?.sys.id === coupon?.brandEntity?.sys.id
  );
  const otherBrandsWithSales = brands?.filter(
    (pBrand) =>
      pBrand?.sys.id !== brand?.sys.id &&
      (pBrand?.linkedFrom?.couponEntryCollection?.total || 0) > 0
  );

  if (!coupon || !brand) {
    return {
      notFound: true,
    };
  }

  const websiteTitle = `Promotion ${brand.name} ${coupon.title}`;

  const metaTags = {
    title: websiteTitle,
    'og:title': websiteTitle,
    'twitter:title': websiteTitle,
    description: `${coupon.description}`,
    'og:description': `${coupon.description}`,
    'twitter:description': `${coupon.description}`,
  };

  return {
    props: {
      preview,
      coupon,
      brand,
      brands: otherBrandsWithSales,
      metaTags,
    },
  };
};

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// the path has not been generated.
export async function getStaticPaths() {
  const { couponEntryCollection } = await fetchFromContentful().Coupons();
  // Get the paths we want to pre-render based on posts
  const paths = couponEntryCollection?.items.map((coupon) => ({
    params: { couponSlug: coupon?.slug, brandSlug: coupon?.brandEntity?.slug },
  }));

  return { paths, fallback: 'blocking' };
}
