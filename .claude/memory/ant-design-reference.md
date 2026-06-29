---
name: ant-design-reference
description: Ant Design 组件库 LLM 友好文档引用
metadata:
  type: reference
---

# Ant Design 组件库参考

Ant Design 是一个企业级 UI 设计语言和 React 组件库。

## 文档位置

完整 LLM 友好文档已下载到: `.claude/ant-design-docs.txt` (60564 行)

## 组件列表 (74 个)

| 通用 | 布局 | 导航 | 数据录入 | 数据展示 | 反馈 | 其他 |
|------|------|------|----------|----------|------|------|
| Button | Layout | Menu | Form | Table | Alert | Divider |
| BorderBeam | Grid | Dropdown | Input | List | Drawer | Icon |
| FloatButton | Space | Steps | InputNumber | Card | Message | Image |
| - | Splitter | Breadcrumb | Select | Tree | Modal | Typography |
| - | Flex | Pagination | TreeSelect | Transfer | Notification | Upload |
| - | Layout | Anchor | Cascader | Avatar | Popconfirm | Watermark |
| - | - | - | DatePicker | Badge | Popover | QRCode |
| - | - | - | TimePicker | Calendar | Progress | Result |
| - | - | - | Slider | Carousel | Spin | Skeleton |
| - | - | - | Switch | Collapse | Tag | Statistic |
| - | - | - | Radio | Descriptions | Timeline | Empty |
| - | - | - | Checkbox | Tabs | Tooltip | ConfigProvider |
| - | - | - | Rate | Segmented | Tour | App |
| - | - | - | ColorPicker | Masonry | - | Affix |
| - | - | - | Mentions | - | - | - |
| - | - | - | AutoComplete | - | - | - |

## 快速查找组件文档

使用 grep 查找组件文档位置:
```bash
grep -n "^## component-name" .claude/ant-design-docs.txt
```

## 安装和使用

```bash
npm install antd
# 或
yarn add antd
```

```tsx
import { Button, Input } from 'antd';
import 'antd/dist/reset.css'; // v5 使用 CSS-in-JS，通常不需要此行

function App() {
  return <Button type="primary">Button</Button>;
}
```

## 类型工具

```tsx
import type { GetRef, GetProps, GetProp } from 'antd';

// 获取组件 ref 类型
type SelectRefType = GetRef<typeof Select>;

// 获取组件 props 类型
type CheckboxGroupType = GetProps<typeof Checkbox.Group>;

// 获取单个 prop 类型
type SelectOptionType = GetProp<typeof Select, 'options'>[number];
```

## 主题定制 (v5)

Ant Design v5 使用 CSS-in-JS，通过 ConfigProvider 定制主题:

```tsx
import { ConfigProvider, theme } from 'antd';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#00b96b',
          borderRadius: 4,
        },
      }}
    >
      <App />
    </ConfigProvider>
  );
}
```

---

## 核心组件详解

### Button 按钮

```tsx
import { Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

// 5种类型: primary / default / dashed / text / link
<Button type="primary">Primary</Button>
<Button>Default</Button>
<Button type="dashed">Dashed</Button>
<Button type="text">Text</Button>
<Button type="link">Link</Button>

// 4种状态: danger / ghost / disabled / loading
<Button type="primary" danger>Danger</Button>
<Button ghost>Ghost</Button>
<Button disabled>Disabled</Button>
<Button loading>Loading</Button>

// 3种尺寸: small / medium / large (默认 medium)
<Button size="large">Large</Button>
<Button size="small">Small</Button>

// 3种形状: default / circle / round
<Button shape="circle" icon={<SearchOutlined />} />
<Button shape="round">Round</Button>

// 图标按钮
<Button type="primary" icon={<SearchOutlined />}>Search</Button>

// block 宽度填满父容器
<Button type="primary" block>Block Button</Button>

// 新属性 (v5.21+): color + variant 组合
<Button color="primary" variant="solid">Solid</Button>
<Button color="primary" variant="outlined">Outlined</Button>
<Button color="primary" variant="filled">Filled</Button>
<Button color="danger" variant="solid">Danger</Button>
<Button color="pink" variant="filled">Pink</Button>
```

### Input 输入框

```tsx
import { Input } from 'antd';
import { UserOutlined } from '@ant-design/icons';

// 基本用法
<Input placeholder="Basic usage" />

// 3种尺寸: large (40px) / medium (32px) / small (24px)
<Input size="large" placeholder="large size" />
<Input size="small" placeholder="small size" />

// 4种变体 (v5): outlined / filled / borderless / underlined
<Input placeholder="Outlined" />
<Input variant="filled" placeholder="Filled" />
<Input variant="borderless" placeholder="Borderless" />
<Input variant="underlined" placeholder="Underlined" />

// 带前缀/后缀图标
<Input prefix={<UserOutlined />} placeholder="Username" />
<Input suffix={<SearchOutlined />} placeholder="Search" />

// Input.Search 搜索框
<Input.Search placeholder="Search" onSearch={value => console.log(value)} />
<Input.Search enterButton="Search" />
<Input.Search loading />

// Input.Password 密码框
<Input.Password placeholder="Password" />

// Input.TextArea 多行文本
<Input.TextArea rows={4} placeholder="TextArea" />
<Input.TextArea showCount maxLength={100} />
```

### Form 表单

```tsx
import { Form, Input, Button, Checkbox } from 'antd';

type FieldType = {
  username?: string;
  password?: string;
  remember?: boolean;
};

const App = () => {
  const [form] = Form.useForm();

  const onFinish = (values: FieldType) => {
    console.log('Success:', values);
  };

  return (
    <Form
      form={form}
      name="basic"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      initialValues={{ remember: true }}
      onFinish={onFinish}
    >
      <Form.Item<FieldType>
        label="Username"
        name="username"
        rules={[{ required: true, message: 'Please input username!' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item<FieldType>
        label="Password"
        name="password"
        rules={[{ required: true, message: 'Please input password!' }]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item<FieldType> name="remember" valuePropName="checked" label={null}>
        <Checkbox>Remember me</Checkbox>
      </Form.Item>

      <Form.Item label={null}>
        <Button type="primary" htmlType="submit">Submit</Button>
      </Form.Item>
    </Form>
  );
};

// 常用验证规则
rules={[
  { required: true, message: 'Required!' },
  { type: 'email', message: 'Invalid email!' },
  { min: 6, message: 'Min 6 characters!' },
  { max: 20, message: 'Max 20 characters!' },
  { pattern: /^1[3-9]\d{9}$/, message: 'Invalid phone!' },
  ({ getFieldValue }) => ({
    validator(_, value) {
      if (!value || getFieldValue('password') === value) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('Passwords do not match!'));
    },
  }),
]}

// 表单实例方法
form.getFieldsValue()      // 获取所有字段值
form.getFieldValue('name') // 获取单个字段值
form.setFieldsValue({})    // 设置字段值
form.resetFields()         // 重置表单
form.validateFields()      // 验证表单
form.submit()              // 提交表单
```

### Select 选择器

```tsx
import { Select } from 'antd';

// 基本用法
<Select
  defaultValue="lucy"
  style={{ width: 120 }}
  options={[
    { value: 'jack', label: 'Jack' },
    { value: 'lucy', label: 'Lucy' },
    { value: 'disabled', label: 'Disabled', disabled: true },
  ]}
/>

// 搜索选择
<Select
  showSearch
  placeholder="Search"
  optionFilterProp="label"
  options={[...]}
/>

// 多选
<Select
  mode="multiple"
  placeholder="Select multiple"
  options={[...]}
/>

// 标签模式 (可创建新选项)
<Select mode="tags" placeholder="Add tags" />

// 分组选项
<Select
  options={[
    {
      label: 'Manager',
      options: [
        { value: 'jack', label: 'Jack' },
        { value: 'lucy', label: 'Lucy' },
      ],
    },
    {
      label: 'Engineer',
      options: [
        { value: 'yiminghe', label: 'Yiminghe' },
      ],
    },
  ]}
/>

// 远程搜索
<Select
  showSearch
  filterOption={false}
  onSearch={handleSearch}
  options={options}
  loading={loading}
/>

// 常用属性
<Select
  allowClear        // 允许清除
  disabled          // 禁用
  loading           // 加载状态
  placeholder=""    // 占位文本
  value={value}     // 受控值
  onChange={handleChange}
/>
```

### Table 表格

```tsx
import { Table, Tag, Space, Button } from 'antd';
import type { TableProps } from 'antd';

interface DataType {
  key: string;
  name: string;
  age: number;
  address: string;
  tags: string[];
}

const columns: TableProps<DataType>['columns'] = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    render: (text) => <a>{text}</a>,
    sorter: (a, b) => a.name.localeCompare(b.name),
  },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
    sorter: true,
  },
  {
    title: 'Tags',
    dataIndex: 'tags',
    key: 'tags',
    render: (_, { tags }) => (
      <>
        {tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
      </>
    ),
    filters: [
      { text: 'Nice', value: 'nice' },
      { text: 'Developer', value: 'developer' },
    ],
  },
  {
    title: 'Action',
    key: 'action',
    render: (_, record) => (
      <Space>
        <Button>Edit</Button>
        <Button danger>Delete</Button>
      </Space>
    ),
  },
];

const dataSource: DataType[] = [
  { key: '1', name: 'John', age: 32, address: 'NY', tags: ['dev', 'nice'] },
  { key: '2', name: 'Jim', age: 42, address: 'LA', tags: ['dev'] },
];

<Table
  columns={columns}
  dataSource={dataSource}
  pagination={{ pageSize: 10 }}
  onChange={handleChange}
  loading={loading}
  rowSelection={{
    type: 'checkbox',
    selectedRowKeys,
    onChange: onSelectChange,
  }}
  expandable={{
    expandedRowRender: (record) => <p>{record.description}</p>,
    rowExpandable: (record) => record.name !== 'Not Expandable',
  }}
/>
```

### Modal 弹窗

```tsx
import { Modal, Button } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

// 受控模式
const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Open Modal</Button>
<Modal
  title="Basic Modal"
  open={open}
  onOk={() => setOpen(false)}
  onCancel={() => setOpen(false)}
>
  <p>Some contents...</p>
</Modal>

// 异步关闭 (等待操作完成)
<Modal
  title="Async Modal"
  open={open}
  confirmLoading={loading}
  onOk={async () => {
    setLoading(true);
    await doSomething();
    setLoading(false);
    setOpen(false);
  }}
  onCancel={() => setOpen(false)}
/>

// 确认对话框 (推荐使用 App.useApp)
const { modal } = App.useApp();
modal.confirm({
  title: 'Are you sure?',
  icon: <ExclamationCircleFilled />,
  content: 'This action cannot be undone.',
  okText: 'Yes',
  cancelText: 'No',
  onOk() { console.log('Confirmed'); },
});

// Modal 属性
<Modal
  title=""          // 标题
  open={false}      // 显示状态
  width={520}       // 宽度
  centered          // 居中显示
  footer={null}     // 无底部按钮
  closable          // 显示关闭按钮
  maskClosable      // 点击遮罩关闭
  destroyOnClose    // 关闭时销毁内容
/>
```

### Message 全局消息

```tsx
import { message, Button } from 'antd';

// 推荐: 使用 hooks 版本
const App = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const showSuccess = () => {
    messageApi.success('Operation successful!');
  };

  return (
    <>
      {contextHolder}
      <Button onClick={showSuccess}>Success</Button>
    </>
  );
};

// 消息类型
messageApi.success('Success message');
messageApi.error('Error message');
messageApi.warning('Warning message');
messageApi.info('Info message');
messageApi.loading('Loading...');

// 自定义配置
messageApi.open({
  type: 'success',
  content: 'Message content',
  duration: 3,       // 显示时长 (秒), 0 为不自动关闭
  key: 'unique',     // 更新消息的唯一标识
});

// Promise 接口
messageApi.loading('Processing...')
  .then(() => messageApi.success('Done!'));

// 全局配置
message.config({
  top: 100,
  duration: 2,
  maxCount: 3,
});
```

### Notification 通知提醒框

```tsx
import { notification, Button } from 'antd';

// 使用 hooks 版本
const [notification, contextHolder] = notification.useNotification();

notification.success({
  message: 'Success',
  description: 'Operation completed successfully.',
  placement: 'topRight', // topRight / topLeft / bottomRight / bottomLeft
});

// 自定义配置
notification.open({
  message: 'Title',
  description: 'Description',
  duration: 4.5,
  placement: 'topRight',
  btn: (
    <Button type="primary" size="small" onClick={() => notification.destroy()}>
      Confirm
    </Button>
  ),
});
```

### DatePicker 日期选择

```tsx
import { DatePicker, Space } from 'antd';
import dayjs from 'dayjs';

// 基本用法
<DatePicker />
<DatePicker picker="week" />
<DatePicker picker="month" />
<DatePicker picker="quarter" />
<DatePicker picker="year" />

// 日期范围
<DatePicker.RangePicker />

// 时间选择
<DatePicker showTime />

// 格式化
<DatePicker format="YYYY-MM-DD" />

// 受控模式
<DatePicker value={dayjs('2024-01-01')} onChange={(date, dateString) => {
  console.log(date, dateString);
}} />

// 禁用日期
<DatePicker disabledDate={(current) => current && current < dayjs().startOf('day')} />
```

### Upload 上传

```tsx
import { Upload, Button, message } from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';

// 基本上传
<Upload
  action="/api/upload"
  onChange={(info) => {
    if (info.file.status === 'done') {
      message.success('Upload successful!');
    } else if (info.file.status === 'error') {
      message.error('Upload failed!');
    }
  }}
>
  <Button icon={<UploadOutlined />}>Click to Upload</Button>
</Upload>

// 拖拽上传
<Upload.Dragger action="/api/upload">
  <p className="ant-upload-drag-icon"><InboxOutlined /></p>
  <p className="ant-upload-text">Click or drag file to upload</p>
</Upload.Dragger>

// 图片上传 (带预览)
<Upload
  action="/api/upload"
  listType="picture-card"
  fileList={fileList}
  onChange={handleChange}
  onPreview={handlePreview}
>
  {fileList.length < 8 && <UploadOutlined />}
</Upload>

// 手动上传
<Upload
  beforeUpload={(file) => {
    setFileList([...fileList, file]);
    return false; // 阻止自动上传
  }}
  fileList={fileList}
>
  <Button>Select File</Button>
</Upload>
```

### Typography 排版

```tsx
import { Typography } from 'antd';

const { Title, Paragraph, Text, Link } = Typography;

<Typography>
  <Title h={1}>H1 Title</Title>
  <Title h={2}>H2 Title</Title>
  <Title h={3}>H3 Title</Title>
  <Title h={4}>H4 Title</Title>
  <Title h={5}>H5 Title</Title>

  <Paragraph>Paragraph text</Paragraph>

  <Text>Default text</Text>
  <Text type="secondary">Secondary text</Text>
  <Text type="success">Success text</Text>
  <Text type="warning">Warning text</Text>
  <Text type="danger">Danger text</Text>
  <Text disabled>Disabled text</Text>
  <Text mark>Marked text</Text>
  <Text code>Code text</Text>
  <Text keyboard>Keyboard text</Text>
  <Text underline>Underlined text</Text>
  <Text delete>Deleted text</Text>
  <Text strong>Strong text</Text>
  <Text italic>Italic text</Text>

  <Link href="https://ant.design">Link</Link>

  // 可编辑
  <Paragraph editable={{ onChange: setContent }}>{content}</Paragraph>

  // 可复制
  <Paragraph copyable>Copyable text</Paragraph>

  // 省略
  <Paragraph ellipsis={{ rows: 2, expandable: true }}>
    Long text that will be ellipsized...
  </Paragraph>
</Typography>
```

### Layout 布局

```tsx
import { Layout, Menu } from 'antd';

const { Header, Footer, Sider, Content } = Layout;

<Layout style={{ minHeight: '100vh' }}>
  <Sider collapsible>
    <Menu
      mode="inline"
      items={[
        { key: '1', label: 'Nav 1' },
        { key: '2', label: 'Nav 2' },
      ]}
    />
  </Sider>
  <Layout>
    <Header style={{ background: '#fff' }}>Header</Header>
    <Content style={{ padding: 24 }}>Content</Content>
    <Footer>Footer</Footer>
  </Layout>
</Layout>
```

### Grid 网格

```tsx
import { Row, Col } from 'antd';

// 24栅格系统
<Row gutter={[16, 16]}>
  <Col span={12}>col-12</Col>
  <Col span={12}>col-12</Col>
</Row>

<Row>
  <Col span={8}>col-8</Col>
  <Col span={8} offset={8}>col-8 offset-8</Col>
</Row>

// 响应式
<Col xs={24} sm={12} md={8} lg={6} xl={4} />
```

### Space 间距

```tsx
import { Space, Button } from 'antd';

<Space>
  <Button>Button 1</Button>
  <Button>Button 2</Button>
</Space>

<Space direction="vertical">
  <Button>Button 1</Button>
  <Button>Button 2</Button>
</Space>

<Space size="large">    // small / middle / large / number
<Space align="center">  // start / center / end / baseline
<Space wrap>            // 自动换行

// 紧凑组合
<Space.Compact>
  <Button>Button 1</Button>
  <Button>Button 2</Button>
</Space.Compact>
```

### Flex 弹性布局 (v5)

```tsx
import { Flex, Button } from 'antd';

<Flex gap="small">
  <Button>Button 1</Button>
  <Button>Button 2</Button>
</Flex>

<Flex gap="small" vertical>
  <Button>Button 1</Button>
  <Button>Button 2</Button>
</Flex>

<Flex justify="center" align="center">
  <Button>Centered</Button>
</Flex>

<Flex wrap gap="small">
  <Button>Button 1</Button>
  <Button>Button 2</Button>
</Flex>
```

### Card 卡片

```tsx
import { Card } from 'antd';
import { Meta } from 'antd/es/card';

<Card title="Card Title" extra={<a href="#">More</a>}>
  <p>Card content</p>
</Card>

// 无边框卡片
<Card bordered={false}>Content</Card>

// 简洁卡片
<Card size="small" title="Small Card">
  <p>Card content</p>
</Card>

// 图片卡片
<Card cover={<img alt="example" src="image.jpg" />}>
  <Meta title="Title" description="Description" />
</Card>

// 可加载卡片
<Card loading={loading}>
  <p>Card content</p>
</Card>

// 栅格卡片
<Card title="Grid Card">
  <Card.Grid style={{ width: '25%' }}>Grid 1</Card.Grid>
  <Card.Grid style={{ width: '25%' }}>Grid 2</Card.Grid>
</Card>
```

### List 列表

```tsx
import { List, Avatar } from 'antd';

const data = ['Item 1', 'Item 2', 'Item 3'];

<List
  header="Header"
  footer="Footer"
  bordered
  dataSource={data}
  renderItem={(item) => (
    <List.Item>
      <List.Item.Meta
        avatar={<Avatar src="avatar.jpg" />}
        title={<a href="#">{item}</a>}
        description="Description"
      />
    </List.Item>
  )}
/>

// 简洁列表
<List
  size="small"
  dataSource={data}
  renderItem={(item) => <List.Item>{item}</List.Item>}
/>
```

### Spin 加载中

```tsx
import { Spin } from 'antd';

<Spin />               // 默认加载指示器
<Spin size="small" />  // small / default / large
<Spin tip="Loading..."> // 带提示文字

// 包裹容器
<Spin spinning={loading}>
  <div>Content</div>
</Spin>

// 自定义指示器
<Spin indicator={<LoadingOutlined spin />} />
```

### Progress 进度条

```tsx
import { Progress } from 'antd';

<Progress percent={30} />
<Progress percent={50} status="active" />
<Progress percent={70} status="exception" />
<Progress percent={100} />

// 圆形进度
<Progress type="circle" percent={75} />
<Progress type="circle" percent={75} strokeColor="#52c41a" />

// 仪表盘
<Progress type="dashboard" percent={75} />

// 小尺寸
<Progress size="small" percent={50} />
<Progress type="circle" size="small" percent={50} />
```

### Drawer 抽屉

```tsx
import { Drawer, Button } from 'antd';

const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Open Drawer</Button>
<Drawer
  title="Drawer Title"
  placement="right"  // top / right / bottom / left
  width={500}
  open={open}
  onClose={() => setOpen(false)}
>
  <p>Drawer content</p>
</Drawer>
```

### Popover 气泡卡片

```tsx
import { Popover, Button } from 'antd';

<Popover
  title="Title"
  content={<div>Content</div>}
  trigger="click"  // hover / click / focus
  placement="top"  // top / left / right / bottom / topLeft ...
>
  <Button>Hover me</Button>
</Popover>
```

### Tooltip 文字提示

```tsx
import { Tooltip, Button } from 'antd';

<Tooltip title="Tooltip text">
  <Button>Hover me</Button>
</Tooltip>

<Tooltip title="Tooltip text" placement="topLeft">
  <Button>Hover me</Button>
</Tooltip>
```

### Popconfirm 气泡确认框

```tsx
import { Popconfirm, Button } from 'antd';

<Popconfirm
  title="Are you sure?"
  description="This action cannot be undone."
  onConfirm={() => console.log('Confirmed')}
  onCancel={() => console.log('Cancelled')}
  okText="Yes"
  cancelText="No"
>
  <Button danger>Delete</Button>
</Popconfirm>
```

### Tabs 标签页

```tsx
import { Tabs } from 'antd';

<Tabs
  defaultActiveKey="1"
  items={[
    { key: '1', label: 'Tab 1', children: 'Content 1' },
    { key: '2', label: 'Tab 2', children: 'Content 2' },
    { key: '3', label: 'Tab 3', children: 'Content 3', disabled: true },
  ]}
/>

// 可编辑标签页
<Tabs type="editable-card" onEdit={onEdit} items={items} />

// 卡片样式
<Tabs type="card" items={items} />

// 位置: top / left / right / bottom
<Tabs tabPosition="left" items={items} />
```

### Tag 标签

```tsx
import { Tag } from 'antd';

<Tag>Tag</Tag>
<Tag color="magenta">Magenta</Tag>
<Tag color="red">Red</Tag>
<Tag color="green">Green</Tag>
<Tag color="blue">Blue</Tag>
<Tag color="orange">Orange</Tag>
<Tag color="purple">Purple</Tag>
<Tag color="cyan">Cyan</Tag>
<Tag color="gold">Gold</Tag>
<Tag color="lime">Lime</Tag>

// 可关闭标签
<Tag closable onClose={() => console.log('Closed')}>Tag</Tag>

// 可选中标签
<Tag.CheckableTag checked={checked} onChange={setChecked}>Tag</Tag.CheckableTag>
```

### Badge 徽标

```tsx
import { Badge, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';

<Badge count={5}>
  <Avatar shape="square" icon={<UserOutlined />} />
</Badge>

// 独立数字
<Badge count={5} />

// 小红点
<Badge dot>
  <Avatar icon={<UserOutlined />} />
</Badge>

// 状态徽标
<Badge status="success" text="Success" />
<Badge status="error" text="Error" />
<Badge status="warning" text="Warning" />
<Badge status="processing" text="Processing" />
<Badge status="default" text="Default" />

// 超出显示
<Badge count={99} overflowCount={99}>
  <Avatar icon={<UserOutlined />} />
</Badge>
```

### Avatar 头像

```tsx
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';

<Avatar icon={<UserOutlined />} />
<Avatar src="avatar.jpg" />
<Avatar size="large" />       // large / default / small
<Avatar size={64} />          // 自定义尺寸
<Avatar shape="square" />     // circle / square

// 头像组
<Avatar.Group maxCount={2}>
  <Avatar src="avatar1.jpg" />
  <Avatar src="avatar2.jpg" />
  <Avatar src="avatar3.jpg" />
</Avatar.Group>
```

### Alert 提示

```tsx
import { Alert } from 'antd';

<Alert message="Success" type="success" />
<Alert message="Warning" type="warning" />
<Alert message="Error" type="error" />
<Alert message="Info" type="info" />

// 带描述
<Alert
  message="Success Tips"
  description="Detailed description"
  type="success"
/>

// 可关闭
<Alert message="Warning" type="warning" closable onClose={() => {}} />

// 带图标
<Alert message="Success" type="success" showIcon />

// 顶部公告
<Alert message="Warning" type="warning" banner />
```

---

## 最佳实践

### 1. 使用 App 组件包裹应用 (v5)

```tsx
import { App } from 'antd';

// 推荐使用 App 组件包裹，可获取全局 message/modal/notification 实例
const MyApp = () => {
  const { message, modal, notification } = App.useApp();
  
  // 使用这些实例可正确读取 ConfigProvider 配置
  message.success('Success!');
};
```

### 2. 使用 ConfigProvider 全局配置

```tsx
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

<ConfigProvider
  locale={zhCN}
  theme={{
    token: {
      colorPrimary: '#1890ff',
    },
    components: {
      Button: {
        borderRadius: 4,
      },
    },
  }}
>
  <App />
</ConfigProvider>
```

### 3. 使用 TypeScript 类型

```tsx
import type { GetRef, GetProps, GetProp } from 'antd';

// 获取组件 ref 类型
type InputRef = GetRef<typeof Input>;

// 获取组件 props 类型
type ButtonProps = GetProps<typeof Button>;

// 获取数组选项类型
type OptionType = GetProp<typeof Select, 'options'>[number];

// Form 字段类型
type FieldType = {
  name?: string;
  age?: number;
};
```

### 4. 表单验证技巧

```tsx
// 自定义验证规则
rules={[
  {
    validator: async (_, value) => {
      if (!value) return Promise.resolve();
      const result = await checkValue(value);
      if (!result.valid) {
        return Promise.reject(new Error(result.message));
      }
      return Promise.resolve();
    },
  },
]}

// 动态表单
<Form.List name="users">
  {(fields, { add, remove }) => (
    <>
      {fields.map(({ key, name, ...restField }) => (
        <Form.Item key={key} {...restField} name={[name, 'firstName']}>
          <Input placeholder="First Name" />
        </Form.Item>
      ))}
      <Button onClick={() => add()}>Add User</Button>
    </>
  )}
</Form.List>
```