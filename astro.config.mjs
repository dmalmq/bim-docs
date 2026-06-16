import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import vercel from "@astrojs/vercel";
import starlightImageZoom from "starlight-image-zoom";

const prerenderDocs = process.env.NODE_ENV === "production";

export default defineConfig({
  output: "server",
  adapter: vercel(),
  integrations: [
    starlight({
      prerender: prerenderDocs,
      plugins: [starlightImageZoom()],
      title: "BIM Tutorials",
      defaultLocale: "en",
      locales: {
        en: { label: "English", lang: "en" },
        ja: { label: "日本語", lang: "ja" },
      },
      sidebar: [
        {
          label: "ACC",
          translations: { ja: "ACC" },
          items: [
            {
              label: "File Structure",
              translations: { ja: "ファイル構成" },
              slug: "acc/file-structure",
            },
            {
              label: "Review & Comments",
              translations: { ja: "レビューとコメント" },
              slug: "acc/review-comments",
            },
            {
              label: "Issues",
              translations: { ja: "Issues（課題管理）" },
              slug: "acc/issues",
            },
          ],
        },
        {
          label: "Revit",
          translations: { ja: "Revit" },
          items: [
            {
              label: "New Project Setup",
              translations: { ja: "新規プロジェクトの設定" },
              slug: "revit/new-project-setup",
            },
          ],
        },
        {
          label: "RevitGeoSuite",
          translations: { ja: "RevitGeoSuite" },
          items: [
            {
              label: "Georeferencing Setup",
              translations: { ja: "ジオリファレンス設定" },
              slug: "revitgeosuite/georeferencing-setup",
            },
            {
              label: "Import PLATEAU Data (Local)",
              translations: { ja: "PLATEAUデータのインポート（ローカル）" },
              slug: "revitgeosuite/import-plateau-local",
            },
            {
              label: "Import Local GIS Files",
              translations: { ja: "ローカルGISファイルのインポート" },
              slug: "revitgeosuite/import-local-gis-files",
            },
          ],
        },
        {
          label: "Plugins",
          translations: { ja: "プラグイン" },
          items: [
            {
              label: "Revit to GeoPackage",
              translations: { ja: "RevitからGeoPackageへ" },
              slug: "plugins/revit-to-geopackage",
            },
            {
              label: "Export to CityGML / 3D Tiles",
              translations: { ja: "CityGML / 3D Tilesへのエクスポート" },
              slug: "plugins/export-citygml-3dtiles",
            },
            {
              label: "GeoPackage to IMDF",
              translations: { ja: "GeoPackageからIMDFへ" },
              slug: "plugins/geopackage-to-imdf",
            },
          ],
        },
      ],
      customCss: ["./src/styles/custom.css"],
    }),
  ],
});
