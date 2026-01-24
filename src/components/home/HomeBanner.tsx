import { Carousel, ConfigProvider } from 'antd';
import Banner01 from '@/assets/images/banner-01.png';
import Banner02 from '@/assets/images/banner-02.png';
import Banner03 from '@/assets/images/banner-03.png';
import Banner04 from '@/assets/images/banner-04.png';
import Banner05 from '@/assets/images/banner-05.png';
import Banner06 from '@/assets/images/banner-06.png';

export default function HomeBanner() {
  return (
    <div className="mb-8">
      <ConfigProvider
        theme={{
          components: {
            Carousel: {
              arrowSize: 32,
            },
          },
        }}
      >
        <Carousel arrows autoplay={{ dotDuration: true }} autoplaySpeed={5000} className="rounded-2xl overflow-hidden">
          <div>
            <img src={Banner01} alt="Banner 01" className="w-full h-[500px] object-cover" />
          </div>
          <div>
            <img src={Banner02} alt="Banner 02" className="w-full h-[500px] object-cover" />
          </div>
          <div>
            <img src={Banner03} alt="Banner 03" className="w-full h-[500px] object-cover" />
          </div>
          <div>
            <img src={Banner04} alt="Banner 04" className="w-full h-[500px] object-cover" />
          </div>
          <div>
            <img src={Banner05} alt="Banner 05" className="w-full h-[500px] object-cover" />
          </div>
          <div>
            <img src={Banner06} alt="Banner 06" className="w-full h-[500px] object-cover" />
          </div>
        </Carousel>
      </ConfigProvider>
    </div>
  );
}
