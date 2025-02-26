import { ProjectMetadata } from "../api/types"
import DefaultBannerImage from "../../assets/default_banner.png";

export function ProjectBanner(props: {
  projectMetadata: ProjectMetadata;
  classNameOverride?: string;
}) {
  const projectBannerImage = props.projectMetadata.bannerImg
    ? `https://${process.env.REACT_APP_PINATA_GATEWAY}/ipfs/${
      props.projectMetadata.bannerImg
    }`
    : DefaultBannerImage;

  return (
    <div>
      <img
        className={
          props.classNameOverride ?? "h-[120px] w-full object-cover rounded-t"
        }
        src={projectBannerImage}
        alt="Project Banner"
      />
    </div>
  );
}