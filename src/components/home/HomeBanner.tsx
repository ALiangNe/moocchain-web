import { Carousel, ConfigProvider } from 'antd';
import Banner01 from '@/assets/images/Banner-01.png';
import Banner02 from '@/assets/images/Banner-02.png';

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
        </Carousel>
      </ConfigProvider>
    </div>
  );
}
