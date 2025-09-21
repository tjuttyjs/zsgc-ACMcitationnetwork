import React from 'react';
import { Form, InputNumber, Select, Button, Row, Col, Collapse, Tag } from 'antd';
import { FilterOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Panel } = Collapse;

const AdvancedFilter = ({ venues, onSearch, initialValues }) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    form.setFieldsValue(initialValues || {});
  }, [initialValues, form]);

  const handleSearch = () => {
    form.validateFields()
      .then(values => {
        const filters = {
          venue: values.venue,
          yearFrom: values.yearRange ? values.yearRange[0] : undefined,
          yearTo: values.yearRange ? values.yearRange[1] : undefined,
          citationsMin: values.citationsMin
        };
        onSearch(filters);
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  const handleReset = () => {
    form.resetFields();
    onSearch({});
  };

  return (
    <Collapse defaultActiveKey={[]} bordered={false}>
      <Panel 
        header={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <FilterOutlined style={{ marginRight: 8 }} />
            高级筛选
          </div>
        } 
        key="advanced-filter"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={initialValues || {}}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="venue"
                label="会议/期刊"
              >
                <Select placeholder="选择会议或期刊" allowClear>
                  {venues.map(venue => (
                    <Option key={venue.id} value={venue.name}>
                      {venue.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="yearRange"
                label="发表年份范围"
              >
                <Select placeholder="选择年份范围" allowClear>
                  <Option value="2020-2024">2020-2024年</Option>
                  <Option value="2015-2019">2015-2019年</Option>
                  <Option value="2010-2014">2010-2014年</Option>
                  <Option value="2005-2009">2005-2009年</Option>
                  <Option value="2000-2004">2000-2004年</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="citationsMin"
                label="最低被引数"
              >
                <InputNumber 
                  placeholder="最小被引数" 
                  min={0} 
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row justify="end" style={{ marginTop: 16 }}>
            <Col>
              <Button onClick={handleReset} style={{ marginRight: 8 }}>
                重置
              </Button>
              <Button type="primary" onClick={handleSearch}>
                应用筛选
              </Button>
            </Col>
          </Row>
        </Form>
      </Panel>
    </Collapse>
  );
};

export default AdvancedFilter;