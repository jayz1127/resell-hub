import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type ActiveListing = {
  name: string;
  sku: string | null;
  price: number;
  thumb: string;
  platforms: ("EBAY" | "POSHMARK" | "MERCARI" | "VINTED" | "DEPOP")[];
};

// One-time snapshot pulled from Flyp's Crosslister ("My items" -> Listed),
// covering every currently-active listing as of Sep 18 2026: title, price,
// SKU, a photo, and which platforms it's live on. Flyp doesn't expose a
// per-platform price, so the same price applies across every platform an
// item is listed on. Cost basis wasn't pulled for these (Flyp doesn't
// surface it in the list view), so every item lands as a hand-me-down with
// no cost -- edit it from the Purchases/Sales page once you know what you
// paid.
const ACTIVE_LISTINGS: ActiveListing[] = [
  {
    "name": "Carhartt Loose Fit Washed Duck Sherpa-Lined Utility Jacket Coat Black L Tall",
    "sku": null,
    "price": 90,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/rc-upload-1789403766521-52fd943d3-194a-4bfe-b78c-d861abdba9f9.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Calvin-klein Men's Purple Shirt",
    "sku": null,
    "price": 15,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/ae02a59f-9140-4159-b125-cf429bbbc14f.jpeg",
    "platforms": [
      "DEPOP"
    ]
  },
  {
    "name": "CRZ Yoga Men's Golf Pants Chinos Stretch Commuter Trousers Black 36x34",
    "sku": "CRZ-PNT-3634-BLK",
    "price": 25,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/rc-upload-1787106207988-16ae4df36d-7076-4611-a096-98ad9a079f35.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Plaid&Plain Men’s Skinny Fit Stretch Dress Pants Chinos Black 36x34 NWT",
    "sku": null,
    "price": 25,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/rc-upload-1787106207988-2fdb58192-a406-42dc-9c8d-4ceb1fa34c04.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Carhartt C003 Duck Insulated Traditional Coat",
    "sku": null,
    "price": 100,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/b65b86d6-c9f6-42e2-b60f-b2546ebcdff2.jpeg",
    "platforms": [
      "VINTED"
    ]
  },
  {
    "name": "Carhartt Mens Brown Medium NWT C003 Firm Duck Insulated Traditional Coat Jacket",
    "sku": "CAR-106674-BRN-M",
    "price": 100,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/rc-upload-1786891821167-155f50297c-c43d-4ba0-878f-94b07f786223.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Rockport Mens Hydro-Shield Waterproof Leather Oxford Shoes Black Size 11.5 M",
    "sku": "76115",
    "price": 40,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/rc-upload-1786648353681-5a47caa84-a59f-4e6e-8e22-7958baa02766.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Zara Blue Linen Blend Button Down Belted Shirtdress Midi Length Size L",
    "sku": null,
    "price": 30,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/rc-upload-1785964986617-56e1ba9604-dfc4-41fe-bc63-109a9ead199c.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Johnston & Murphy Amherst Plain Toe Men's Size 13 M Black Leather Derby Shoes",
    "sku": "59-4891",
    "price": 65,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/rc-upload-1785964986617-39431b6431-2aa1-4d71-a53d-a1b28bb419f4.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Nike Air Force 1 High Sculpt Phantom Yellow Ochre Women's Size 10",
    "sku": "DC3590-001",
    "price": 25,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/rc-upload-1785964986617-30efb162b3-6f65-42b2-94aa-c14860e19a67.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "adidas Men's Court Tennis Shoes White Red Black Size 12.5",
    "sku": "HQ8469",
    "price": 30,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/rc-upload-1785964986617-12165760cf-e154-4fac-bca5-975deb19cf5c.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "adidas CourtJam Control M Men's Tennis Shoes White Black Size 12.5",
    "sku": "ID1538",
    "price": 40,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/rc-upload-1785964986617-49aa27f38-1699-4e2a-9083-2c428bf4d7f7.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "YFB Young Fabulous & Broke Women Medium Mauve Pink Maxi Dress Flutter Sleeve",
    "sku": null,
    "price": 50,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/edited_image_1785897593757.png357d6aef-8b03-45a4-99e7-ab5e7e13242c.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Chico's Navy Blue Eyelet Tiered Midi Dress Short Sleeve V-Neck Size 1 (US 8)",
    "sku": null,
    "price": 35,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/edited_image_1785897290898.png877469ea-bf85-4e58-9769-8ded49840486.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "INC International Concepts Women Large Black Ruched Collared Maxi Shirt Dress",
    "sku": "100215500MS",
    "price": 75,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/rc-upload-1785893042015-491132c9e15-1da1-4e0b-89e1-c6b65bbdff65.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Elie Tahari Women Size L Charcoal Knit Long Sleeve Belted Midi Sweater Dress NWT",
    "sku": null,
    "price": 80,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/rc-upload-1785893042015-482b4d54400-acd2-4f6b-aeab-86c72b073700.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Tommy Hilfiger Women's Size 10 Denim Maxi Dress V-Neck Short Sleeve",
    "sku": null,
    "price": 45,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/rc-upload-1785893042015-474dd428df7-55f4-4b76-a5c6-d62ce8c81f0b.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Tommy Bahama Women's Medium Multi Stripe Dobby Split Neck Dress NWT",
    "sku": "SS500605",
    "price": 75,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/edited_image_1785895958216.pngaff212eb-e503-4554-8090-c8c009d0c4b7.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "SHEIN Dusty Rose Pink Button-Front Tiered Maxi Skirt Size S (US 4)",
    "sku": null,
    "price": 15,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/edited_image_1785896056180.pngcad10264-d60f-4e3b-bec1-3623815d951c.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Adrianna Papell Steel Blue Metallic Knit Covered Gown NWT Size 12 AP1E209543",
    "sku": "AP1E209543-SZ12",
    "price": 125,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/rc-upload-1785893042015-440a2c87506-cb61-40d7-bcb1-eb96274088fd.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Nike Air Force 1 High Sculpt Phantom Yellow Ochre Women's Size 10",
    "sku": "DC3590-001",
    "price": 25,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/6280b53d-803a-4fea-a3b2-39c03bfd4cd7.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Carhartt Detroit Blanket Lined Work Jacket Black Gray Mens XL NWT",
    "sku": null,
    "price": 100,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/e53fec2d-8ee8-4194-9ec7-44b47c2693e4.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Brand new with tags Men Carhartt Detroit Jacket in Black (Size L, Relaxed Fit).",
    "sku": null,
    "price": 105,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/e5dae11f-fda1-4128-8b6c-aa0116144176.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "EBAY"
    ]
  },
  {
    "name": "Carhartt Men's Blue/Black Hooded Quilted-Lined Full Zip Work Jacket XL Tall J04",
    "sku": null,
    "price": 90,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/7b2692b5-1f4b-4e81-9dcb-29e0d58a0eff.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Carhartt Men's Brown Blanket-Lined Chore Jacket Long Coat XL Tall Big & Tall",
    "sku": null,
    "price": 90,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/35cf1f4e-a150-400b-93b3-8b4354a04a75.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Johnston & Murphy Men's Derby Dress Shoes Black Lace-Up US 13 M Tru Foam",
    "sku": null,
    "price": 60,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/4c721d23-1d4b-4c93-8d65-0fe1d7c674b6.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "2 Men's Black Dress Shirt (read description)",
    "sku": null,
    "price": 25,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/fa49d52e-41a2-426c-9998-f245a1be9a8b.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Bundle: 2 men’s dress shirts (read description carefully)",
    "sku": null,
    "price": 35,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/156842c5-2f09-4ceb-8774-9f3b13972bcd.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Bundle: 2 men’s used pink dress shirts (read description)",
    "sku": null,
    "price": 45,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/52dd4241-b586-4ff9-9089-4aae448d95d8.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Van Heusen Men’s Blue Slim Fit Cotton Twill Chino Pants 33W x 34L",
    "sku": null,
    "price": 15,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/09f753ba-f54a-4f0e-9026-2e641e4224d4.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Cuts Men's Black Joggers-tracksuits",
    "sku": null,
    "price": 25,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/bdde2581-a783-4789-96a5-5ffa5c372536.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Joseph Abboud & International Concepts Men's Black Polo-shirts",
    "sku": null,
    "price": 15,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/d009a153-c257-4cfa-8504-55e3f15dae8e.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Goodfellow-co Men's Black and Navy Trousers",
    "sku": null,
    "price": 20,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/dbe51133-3637-4ecd-a81c-2ef7c4427692.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Old-navy Men's Joggers-tracksuits",
    "sku": null,
    "price": 50,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/380ea375-bdaf-4934-bb11-4cb3b165bb6f.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Bundle of 3 GymElite Black Men's Large Dry Fit T Shirts",
    "sku": null,
    "price": 25,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/80b4ad10-04fe-4e1d-809c-1792bcc81ebf.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Champion Men's Black Joggers-tracksuits (read description)",
    "sku": null,
    "price": 50,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/91d97c76-8599-4538-aa05-01f2fef83da6.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Bundle: 2 men’s used blue sweaters (read description)",
    "sku": null,
    "price": 25,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/310d4ae7-fb21-4b97-baba-1a7242c74f22.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "NFL Men's Baker Mayfield Cleveland Browns Jersey",
    "sku": null,
    "price": 30,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/c3b7054f-db12-4f43-bd15-4237eb9f515c.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Sport-Tek Men's Black Zip up Jacket",
    "sku": null,
    "price": 10,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/329490cb-c5b7-42bf-ae31-644718b91df9.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Bundle: 2 men’s dark grey sweatpants (read description)",
    "sku": null,
    "price": 30,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/f246e281-7f96-4021-b09c-6df03694fa5b.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Bundle: Tommy-bahama Men's Quarter-Zip and Artist Union Hoodi",
    "sku": null,
    "price": 30,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/6abe5e40-a888-4cc1-baa3-6c4794ddfceb.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  },
  {
    "name": "Bundle of 3 crewneck men’s sweaters (read description)",
    "sku": null,
    "price": 50,
    "thumb": "https://d2m6fz5bnzikdu.cloudfront.net/thumbnail-users/179213/edited_image_1785984991538.png85f355b1-124b-44c5-8773-85c77a888984.jpeg",
    "platforms": [
      "POSHMARK",
      "MERCARI",
      "DEPOP",
      "VINTED",
      "EBAY"
    ]
  }
];

async function importActiveListings() {
  "use server";

  let imported = 0;
  let skipped = 0;

  for (const row of ACTIVE_LISTINGS) {
    const existing = await prisma.item.findFirst({ where: { name: row.name } });
    if (existing) {
      skipped++;
      continue;
    }

    const item = await prisma.item.create({
      data: {
        name: row.name,
        sku: row.sku,
        sourceType: "HAND_ME_DOWN",
        costBasis: null,
        status: "ACTIVE",
        images: [row.thumb],
        notes: "Imported from Flyp",
      },
    });

    for (const platform of row.platforms) {
      await prisma.listing.create({
        data: {
          itemId: item.id,
          platform,
          price: row.price,
          status: "ACTIVE",
        },
      });
    }

    imported++;
  }

  revalidatePath("/inventory");
  revalidatePath("/purchases-sales");
  revalidatePath("/dashboard");
  revalidatePath("/data");

  redirect(`/admin/import-active-listings?imported=${imported}&skipped=${skipped}`);
}

export default function ImportActiveListingsPage({
  searchParams,
}: {
  searchParams?: { imported?: string; skipped?: string };
}) {
  const done = searchParams?.imported != null;

  return (
    <div>
      <h1>Import active Flyp listings</h1>
      <p style={{ color: "#666", maxWidth: 600 }}>
        One-time import of everything currently listed on Flyp (title,
        photo, price, and which platforms it's live on). Safe to run more
        than once -- items already imported (matched by name) are skipped.
      </p>

      {done && (
        <p
          style={{
            padding: "0.75rem 1rem",
            background: "#eefbea",
            border: "1px solid #b7e6ac",
            borderRadius: 6,
            maxWidth: 600,
          }}
        >
          Imported {searchParams?.imported}, skipped {searchParams?.skipped} (already present).
        </p>
      )}

      <form action={importActiveListings}>
        <button
          type="submit"
          style={{ padding: "0.6rem 1.2rem", fontWeight: 600, cursor: "pointer" }}
        >
          Import {ACTIVE_LISTINGS.length} active listings from Flyp
        </button>
      </form>
    </div>
  );
}
